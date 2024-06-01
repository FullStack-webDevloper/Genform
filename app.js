require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const multer = require('multer');



// MongoDB connection setup
mongoose.connect(process.env.ATLASDB_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const pdfSchema = new mongoose.Schema({
    filename: String,
    name: String,
    dob: String,
    dateCreated: { type: Date, default: Date.now }
});

const PDFModel = mongoose.model('PDF', pdfSchema);

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Define the directory to store PDF files
const pdfDirectory = path.join(__dirname, 'pdfs');

// Ensure the directory exists
if (!fs.existsSync(pdfDirectory)) {
    fs.mkdirSync(pdfDirectory);
}

app.get('/', (req, res) => {
    res.render('form');
});

app.post('/submit-form', async (req, res) => {
    const formData = req.body;
    const doc = new PDFDocument();

    const filename = `birth_certificate_${Date.now()}.pdf`;
    const filePath = path.join(pdfDirectory, filename);

    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.font('Times-Roman');

    // Add the image to the top left side of the PDF
    const logoPath = path.join(__dirname, 'i2.jpg');  // Ensure this path points to your image file
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 10, 10, { width: 50 });  // Adjust the width and position as needed
    }
    const centerImagePath = path.join(__dirname, 'i1.jpg');  // Ensure this path points to your image file
    if (fs.existsSync(centerImagePath)) {
        const centerImageWidth = 25;  // Adjust the width of the image as needed
        const pageWidth = doc.page.width;
        const centerImageX = (pageWidth - centerImageWidth) / 2;
        doc.image(centerImagePath, centerImageX, 50, { width: centerImageWidth });  // Adjust the y-position as needed
    }
    doc.fontSize(10).text('GOVERNMENT OF UTTAR PRADESH', { align: 'center' });
    // Add the specified text at the top of the PDF
    doc.fontSize(10).text('1969 12 / 17 2002 8/13', { align: 'center' });
    doc.fontSize(10).text('(ISSUED UNDER SECTION 12/17 OF THE REGISTRATION OF BIRTHS & DEATHS ACT. 1969 AND RULE 8/13 OF THE PRADESH REGISTRATION OF BIRTHS & DEATHS RULES 2002)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('IS TO CERTIFY THAT THE FOLLOWING INFORMATION HAS BEEN TAKEN FROM THE ORIGINAL RECORD OF BIRTH WHICH IS THE REGISTER FOR GRAMA PANCHAYAT CHANDPURPHERU OF TAHSIL\'BLOCK BIJNOR OF DISTRICT BIJNOR OF STATE/UNION TERRITORY UTTAR PRADESH. INDIA', { align: 'center' });

    doc.moveDown(1);  // Add some space before the rest of the content

    doc.fontSize(18).text('Birth Certificate', { align: 'center' });

    doc.fontSize(14).text(`Name: ${formData['child-name']}`);
    doc.fontSize(14).text(`Sex: ${formData.gender}`);
    doc.fontSize(14).text(`Date of Birth: ${formData['dob-numbers']} (${formData['dob-words']})`);
    doc.fontSize(14).text(`Place of Birth: ${formData['place-of-birth']}`);
    doc.fontSize(14).text(`Mother's Name: ${formData['mother-name']}`);
    doc.fontSize(14).text(`Mother's Aadhaar No: ${formData['mother-aadhaar']}`);
    doc.fontSize(14).text(`Father's Name: ${formData['father-name']}`);
    doc.fontSize(14).text(`Father's Aadhaar No: ${formData['father-aadhaar']}`);
    doc.fontSize(14).text(`Address of Parents at the Time of Birth: ${formData['address-at-birth']}`);
    doc.fontSize(14).text(`Permanent Address of Parents: ${formData['permanent-address']}`);
    doc.fontSize(14).text(`Registration Number: ${formData['registration-number']}`);
    doc.fontSize(14).text(`Date of Registration: ${formData['registration-date']}`);
    doc.fontSize(14).text(`Remarks (if any): ---`);
    doc.fontSize(14).text(`Date of Issue: ${new Date().toLocaleDateString()}`);
    doc.fontSize(14).text(`Issuing Authority: Registrar (Birth & Death)`);
   
    doc.fontSize(14).text(`UPDATED ON: ${new Date().toLocaleString()}`);

    // Generate QR code
    const qrData = `Name: ${formData['child-name']}\nSex: ${formData.gender}\nDate of Birth: ${formData['dob-numbers']} (${formData['dob-words']})\nPlace of Birth: ${formData['place-of-birth']}\nRegistration Number: ${formData['registration-number']}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Add QR code to the PDF
    doc.image(qrCode, {
        fit: [100, 100],
        align: 'center',
        valign: 'center'
    });

    doc.end();

    writeStream.on('finish', async () => {
        console.log('PDF stored locally', filePath);

        // Save the PDF metadata to MongoDB
        const newPDF = new PDFModel({
            filename: filename,
            name: formData['child-name'],
            dob: formData['dob-numbers']
        });

        await newPDF.save();

        res.redirect(`/file/${filename}`);
    });
});

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    const { name, dob } = req.body;
    const { path: tempPath, originalname } = req.file;

    const filename = `uploaded_${Date.now()}_${originalname}`;
    const filePath = path.join(pdfDirectory, filename);

    fs.rename(tempPath, filePath, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving the file');
        }

        // Save the PDF metadata to MongoDB
        const newPDF = new PDFModel({
            filename: filename,
            name: name,
            dob: dob
        });

        await newPDF.save();

        res.redirect('/search');
    });
});

app.get('/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(pdfDirectory, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.get('/search', (req, res) => {
    res.render('search');
});

app.get('/search-result', async (req, res) => {
    const name = req.query['name'];
    const dob = req.query['dob'];

    const matchingPDFs = await PDFModel.find({ name: name, dob: dob });

    if (matchingPDFs.length > 0) {
        res.render('search-result', { files: matchingPDFs });
    } else {
        res.render('search-result', { files: [] });
    }
});

app.listen(8080, () => {
    console.log('Server started on http://localhost:8080');
});
