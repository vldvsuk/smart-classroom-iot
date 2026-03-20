use rand::Rng;
use reqwest::blocking::Client;
use serde::Serialize; // convert rust strucs  into json 
use std::{thread, time::Duration};

#[derive(Serialize, Debug)]
struct SensorData {
    temperature: i32,
    humidity: i32,
}

fn main() {
    let client = Client::new();

    loop {
        let data = SensorData {
            temperature: rand::thread_rng().gen_range(18..30),
            humidity: rand::thread_rng().gen_range(40..70),
        };

        let res = client
            .post("http://localhost:3000/data")
            .json(&data)
            .send();

        println!("Sent: {:?}", data);

        match res {
            Ok(_) => println!("Success"),
            Err(e) => println!("Error: {:?}", e),
        }

        thread::sleep(Duration::from_secs(2));
    }
}