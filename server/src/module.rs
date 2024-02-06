#[derive(Debug, Clone)]
pub struct User {
    pub name: String,
    pub is_admin: bool,
    pub token: String,
}

pub trait Module: std::fmt::Debug {
    fn name(&self) -> &'static str;
    fn load(&mut self) -> Result<(), String>;
    fn save(&self) -> Result<(), String>;
    fn dispatch(&mut self, msg: &str, user: &User) -> Result<(), String>;
    fn serialize(&self) -> Result<String, String>;
}

pub mod wordcloud;
