#[actix_web::main]
async fn main() -> std::io::Result<()> {
    server::main().await
}
