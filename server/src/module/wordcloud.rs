#[derive(Debug)]
pub struct Wordcloud {
    words: Vec<String>,
}

#[derive(serde::Deserialize, Debug)]
enum Message {
    Add(String),
    Remove(String),
}

impl Default for Wordcloud {
    fn default() -> Self {
        Self { words: Vec::new() }
    }
}

impl super::Module for Wordcloud {
    fn name(&self) -> &'static str {
        "wordcloud"
    }

    fn load(&mut self) -> Result<(), String> {
        Ok(())
    }

    fn save(&self) -> Result<(), String> {
        Ok(())
    }

    fn dispatch(&mut self, msg: &str, user: super::User) -> Result<(), String> {
        // deserialize message
        let message = serde_json::from_str::<Message>(msg)
            .map_err(|e| format!("failed to deserialize message: {}", e))?;

        println!("message: {:?}", message);

        Ok(())
    }

    fn serialize(&self) -> Result<String, String> {
        Ok("".to_owned())
    }
}
