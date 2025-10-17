use std::fs::File;
use serde_json::Value;
use csv;
use neon::prelude::*;
enum GetIDError {
    IDNotFound,
}

#[unsafe(no_mangle)]
fn rate(mut cx: FunctionContext) -> JsResult<JsNumber> { 
    let id = cx.argument::<JsNumber>(0).ok().unwrap().value(&mut cx) as u32;
    let filename = get_file(&id);
    let filenameunwrapped: String = match filename {
        Ok(filename) => filename,
        Err(filename) => "File Not Found".to_string()   
    };
    if filenameunwrapped == "File Not Found" {
        return cx.throw_error("could not find ID");
    }
    let filepath = "../algorithm/data/partitioned/".to_string() + filenameunwrapped.as_str();
    let file = File::open(filepath).unwrap();
    let mut rdr = csv::Reader::from_reader(file);
    for row in rdr.records() {
        let row_unwrapped = match row {
            Ok(row) => row,
            Err(_) => continue,
        };     
        if row_unwrapped[0] == id.to_string() {
           let score = row_unwrapped[row_unwrapped.len() - 1].trim().parse().unwrap_or(0.0)  as f32;
           return Ok(cx.number(score as u8));
        }

    };
    return cx.throw_error("Could not find Score");

}

fn get_file(id: &u32) -> Result<String, GetIDError> {
    let filepath = "../algorithm/data/partitioned/lookuptable.json";
    let file = File::open(filepath).unwrap();
    let parsed: Value = serde_json::from_reader(file).unwrap();
    let key = id.to_string();
    parsed.get(&key)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()) 
        .ok_or(GetIDError::IDNotFound)
}
#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("rate", rate)?;
    Ok(())
}


