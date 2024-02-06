pub mod broadcast;
pub mod module;

use std::sync::{Mutex, RwLock};
use std::{io, sync::Arc};

use actix_session::storage::CookieSessionStore;
use actix_session::{Session, SessionMiddleware};
use actix_web::{get, middleware::Logger, post, web, App, HttpResponse, HttpServer, Responder};
use actix_web_lab::respond::Html;
use rand::Rng;

use self::broadcast::Broadcaster;

#[derive(Debug)]
pub struct Server {
    module: Arc<RwLock<Box<dyn module::Module + Send + Sync>>>,
    pin: String,
    admin_pin: String,
    users: Arc<RwLock<Vec<module::User>>>,
}

impl Server {
    pub fn serialize(&self) -> Result<String, Box<dyn std::error::Error + '_>> {
        let users = self
            .users
            .write()
            .unwrap()
            .clone()
            .iter()
            .map(|u| (u.name.clone(), u.is_admin))
            .collect::<Vec<_>>();
        let users = serde_json::to_string(&users)
            .map_err(|e| format!("failed to serialize users: {}", e))?;

        Ok(format!(
            r#"{{
                "moduleId": "{}",
                "module": {},
                "users": {},
            }}"#,
            self.module.read()?.name(),
            self.module.read()?.serialize()?,
            users
        ))
    }
}

fn session_middleware() -> SessionMiddleware<CookieSessionStore> {
    SessionMiddleware::builder(
        CookieSessionStore::default(),
        actix_web::cookie::Key::from(&[0; 64]),
    )
    .cookie_name("token".to_owned())
    .cookie_same_site(actix_web::cookie::SameSite::Strict)
    .cookie_content_security(actix_session::config::CookieContentSecurity::Private)
    .build()
}

fn generate_pin(length: u8) -> String {
    // generate a random numeric pin of the given length
    let mut rng = rand::thread_rng();
    let pin: Vec<u8> = (0..length).map(|_| rng.gen_range(0..10)).collect();

    pin.iter().map(|d| d.to_string()).collect()
}

pub async fn main() -> io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let data = Broadcaster::create();

    let pin = generate_pin(4);
    let admin_pin = generate_pin(6);

    println!("||===== PINS =====||");
    println!("|| user:  {}    ||", pin);
    println!("|| admin: {}  ||", admin_pin);
    println!("||================||");

    let server = Arc::new(Server {
        pin,
        admin_pin,
        module: Arc::new(RwLock::new(Box::new(
            module::wordcloud::Wordcloud::default(),
        ))),
        users: Arc::new(RwLock::new(Vec::new())),
    });

    log::info!("starting HTTP server at http://localhost:8080");

    HttpServer::new(move || {
        App::new()
            .wrap(session_middleware())
            .app_data(web::Data::from(Arc::clone(&data)))
            .app_data(web::Data::new(server.clone()))
            .service(index)
            .service(event_stream)
            .service(broadcast_msg)
            .service(dispatch)
            .service(login)
            .wrap(Logger::default())
    })
    .bind(("0.0.0.0", 8080))?
    .workers(2)
    .run()
    .await
}

#[get("/")]
async fn index() -> impl Responder {
    Html(include_str!("index.html").to_owned())
}

#[get("/events")]
async fn event_stream(broadcaster: web::Data<Broadcaster>) -> impl Responder {
    broadcaster.new_client().await
}

#[post("/broadcast")]
async fn broadcast_msg(broadcaster: web::Data<Broadcaster>, msg: String) -> impl Responder {
    broadcaster.broadcast(&msg).await;
    HttpResponse::Ok().body("msg sent")
}

#[post("/dispatch")]
async fn dispatch(
    broadcaster: web::Data<Broadcaster>,
    server: web::Data<Arc<Server>>,
    msg: String,
    session: Session,
) -> impl Responder {
    let user_token = session.get::<String>("token").unwrap();

    let user_token = match user_token {
        Some(token) => token,
        None => return HttpResponse::Unauthorized().body("not logged in"),
    };

    println!("{:#?}", server);

    // look up user
    let users = server.users.read().unwrap().clone();

    let uDBG = users.clone();

    let user = users.into_iter().find(|u| u.token == user_token);

    let user = match user {
        Some(user) => user,
        None => {
            println!("user not found {:?} in {:?}", user_token, uDBG);
            return HttpResponse::Unauthorized().body("auth invalid");
        }
    };

    println!("user: {:#?}", user);

    match server.module.write().unwrap().dispatch(&msg, &user) {
        Ok(_) => (),
        Err(e) => return HttpResponse::BadRequest().body(e),
    }

    let serialized = server.serialize().unwrap();

    broadcaster.broadcast(&serialized).await;

    HttpResponse::Ok().body("msg sent")
}

#[derive(serde::Deserialize)]
struct Login {
    pub pin: String,
    pub name: String,
}

#[post("/login")]
async fn login(
    broadcaster: web::Data<Broadcaster>,
    server: web::Data<Arc<Server>>,
    body: actix_web::web::Json<Login>,
    session: Session,
) -> impl Responder {
    if body.pin == server.pin {
        let token = format!("{:x}", uuid::Uuid::new_v4());

        session.insert("token", token.clone()).unwrap();

        server.users.write().unwrap().push(module::User {
            name: body.name.clone(),
            is_admin: false,
            token,
        });

        broadcaster.broadcast(&server.serialize().unwrap()).await;
        HttpResponse::Ok().body("logged in as user")
    } else if body.pin == server.admin_pin {
        let token = format!("{:x}", uuid::Uuid::new_v4());

        session.insert("token", token.clone()).unwrap();

        server.users.write().unwrap().push(module::User {
            name: body.name.clone(),
            is_admin: true,
            token,
        });

        broadcaster.broadcast(&server.serialize().unwrap()).await;
        HttpResponse::Ok().body("logged in as admin")
    } else {
        HttpResponse::Unauthorized().body("wrong pin")
    }
}
