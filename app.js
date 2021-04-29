// import express from 'express';
const express = require('express');
const db = require('./db/db');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');
const csvtojson =require('csvtojson')

const upload = multer({ dest: 'tmp/csv/' });

const PORT = 9999;


const app = express();

// Parse incoming requests data
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false}));


app.post('/api/v1/doctors', upload.single('file'), (req, res, next) => {

    const header = req.headers["content-type"].split(';')[0];
    
    if (header === "multipart/form-data") {
        res.setHeader("Content-Type", "text/css");
        const csvFilePath = req.file.path;
        csvtojson()
            .fromFile(csvFilePath)
            .then((jsonObj) => {

                let id = '';
                let familyName = '';
                let givenName = '';
                const formatedDoctors = {};
                jsonObj.map((practitioner) => {
                    if (id !== practitioner.ID) {
                        id = practitioner.ID;
                        familyName = practitioner.FamilyName;
                        givenName = practitioner.GivenName
                    }
                    if (familyName !== practitioner.FamilyName || givenName !== practitioner.GivenName) {
                        return res.status(404).send({ message: "Ati introdus *NUME* diferite pentru acelasi *ID*. Verificati fisierul CSV pe care l-ati incarcat si asigurativa ca datele sunt ok!" });
                        
                    }
                    if (practitioner.Active === 'true') {
                        if (!(getFullName(practitioner) in formatedDoctors)) {
                            formatedDoctors[getFullName(practitioner)] = [practitioner.NameId];
                        } else {
                            formatedDoctors[getFullName(practitioner)].push(practitioner.NameId);
                        }
                    }
                });
                for (let x in formatedDoctors) {
                    console.log(x + ': ' + formatedDoctors[x].join(', '));
                }
            })
    } else {
        const doctor = req.body;

        let flag = true;
    
        db.map((doc) => {
            if (parseInt(doc.id) === parseInt(doctor.id)) {
                console.log('The *ID* is already in use!')
                flag = false;
                return res.status(404).send({
                    success: true,
                    message: 'The *ID* is already in use!'

                });
            
            }
        });

        if (doctor.resourceType !== "Practitioner" || doctor.resourceType === undefined || doctor.id === undefined || doctor.id === '') {
            console.log('The doctor does not have *ID* or the *Resource Type* is not *Practitioner*');
            flag = false;
            return res.status(404).send({
                success: false,
                message: 'The doctor does not have *ID* or the *Resource Type* is not *Practitioner*'
            });
        }

        if (doctor.active === false) {
            console.log("The doctor does not have active status");
            db.push(doctor);
            flag = false;
            return res.status(200).send({
                success: true,
                message : "The doctor does not have active status"
            });
        }
            
        if (flag) {
            console.log("Doctor with name:")
            console.log(doctor.name[0].text);
            console.log(" who works at: ")
            doctor.facility.map((facility) => {
                console.log(facility.name);
            })
            console.log("was successfully added!!")
            db.push(doctor);
            return res.status(201).send({
                success: true,
                message: `The doctor *${doctor.name[0].text}* was successfully added`
            });
        }   
        }
    
});

const getFullName = (practitioner) => {
  return `${practitioner.GivenName} ${practitioner.FamilyName}`;
};

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});