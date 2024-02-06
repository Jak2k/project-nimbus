use std::sync::{Arc, RwLock};

#[derive(Debug)]
pub struct Wordcloud {
    words: Arc<RwLock<Vec<String>>>,
}

impl serde::Serialize for Wordcloud {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let words = self.words.read().unwrap().clone();
        words.serialize(serializer)
    }
}

#[derive(serde::Deserialize, Debug)]
enum Message {
    Add(String),
    Remove(String),
}

impl Default for Wordcloud {
    fn default() -> Self {
        Self {
            words: Arc::new(RwLock::new(Vec::new())),
        }
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

    fn dispatch(&mut self, msg: &str, user: &super::User) -> Result<(), String> {
        // deserialize message
        let message = serde_json::from_str::<Message>(msg)
            .map_err(|e| format!("failed to deserialize message: {}", e))?;

        println!("message: {:?}", message);

        match message {
            Message::Add(word) => {
                self.words.write().unwrap().push(word);
            }
            Message::Remove(word) => {
                let mut words = self.words.write().unwrap();
                if let Some(index) = words.iter().position(|w| w == &word) {
                    words.remove(index);
                }
            }
        }

        Ok(())
    }

    fn serialize(&self) -> Result<String, String> {
        Ok(serde_json::to_string(self).map_err(|e| format!("failed to serialize: {}", e))?)
    }
}
