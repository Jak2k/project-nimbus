#[derive(Debug, Clone)]
pub struct User {
    pub name: String,
    pub is_admin: bool,
    pub token: String,
}

pub trait Module {
    fn name(&self) -> &'static str;
    fn load(&mut self) -> Result<(), String>;
    fn save(&self) -> Result<(), String>;
    fn dispatch(&mut self, msg: &str, user: User) -> Result<(), String>;
    fn serialize_user(&self) -> Result<String, String>;
    fn serialize_admin(&self) -> Result<String, String>;
}

pub mod wordcloud;
