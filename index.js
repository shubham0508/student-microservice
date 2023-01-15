const express = require("express");
const mysql = require("mysql");
const app = express();
const bodyParser = require('body-parser')
const axios = require('axios')

app.use(bodyParser.json());

const mysqlConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "student",
  multipleStatements: true,
});

mysqlConnection.connect((err) => {
  if (!err) console.log("Connection Established Successfully");
  else console.log("Connection Failed!" + JSON.stringify(err, undefined, 2));
});

app.get("/", (req, res) => {
  res.send("Its working Fine-Student Microservice");
});

app.get("/studentList", (req, res) => {
  mysqlConnection.query("SELECT * FROM student_info", async (err, rows, fields) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
        const response = []
        await Promise.all(rows.map(async (item)=>{
            const promises = item.subjects.split(',').map(async (subject) =>{
                const { data , err} = await axios.get(`http://localhost:8082/subject/${subject}`);
                return data.data.data[0].name
            })
            
            const results = await Promise.all(promises)
            response.push({
                'name' : item.name,
                'phoneNumber': item.phone_number,
                'schoolName': item.school_name,
                'subjectsList': results
            })

        }))

        res.json({
            'status' : 200,
            'data' : {
                'data' : response,
                'message' : 'Successfully Fetched Records'
            }
        })
    }
  });
});

app.post("/student", (req, res) => {
  const reqBody = req.body;
  mysqlConnection.query(
    "INSERT INTO student.student_info (name, phone_number, school_name, subjects) VALUES (?,?,?,?);",
    [reqBody.name, reqBody.phoneNumber, reqBody.schoolName, reqBody.subjects.toString()],
    (err, results, fields) => {
      if(err){
        console.log(err);
        res.send(`There has been an error ${err}`);
      } else {
        res.json({
            'status' : 200,
            'data': {
                'message' : 'Record Inserted Successfully!!',
                'data': results
            }
        })
      }
    }
  );
});

app.listen(8081);
