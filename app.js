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
mongoose.connect(process.env.ATLASDB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Increase timeout to 30 seconds
  });
   

  

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
    const doc = new PDFDocument({ margin: 50 });

    const filename = `birth_certificate_${Date.now()}.pdf`;
    const filePath = path.join(pdfDirectory, filename);

    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.font('Times-Roman');

    // Add the image to the top left side of the PDF
    const logoPath = path.join(__dirname, 'i2.jpg');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 10, 10, { width: 50 });
    }
    
    const centerImagePath = path.join(__dirname, 'i1.jpg');
    if (fs.existsSync(centerImagePath)) {
        const centerImageWidth = 25;
        const pageWidth = doc.page.width;
        const centerImageX = (pageWidth - centerImageWidth) / 2;
        doc.image(centerImagePath, centerImageX, 10, { width: centerImageWidth });
    }
    const centerImagePath1 = path.join(__dirname, 'i4.jpg');

    if (fs.existsSync(centerImagePath1)) {
        const centerImageWidth = 50; // Adjust the width as needed
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height; // Optionally, if you need to adjust y-coordinate
    
        const rightImageX = pageWidth - centerImageWidth - 10; // 10 is the margin from the right edge
        const topImageY = 10; // 10 is the margin from the top edge
    
        doc.image(centerImagePath1, rightImageX, topImageY, { width: centerImageWidth});
    }
    

    // Adding the headers and other information
    doc.fontSize(7.5).text('GOVERNMENT OF UTTAR PRADESH', { align: 'center' ,color:'blue'});
    doc.fontSize(7.5).text('1969 12 / 17 2002 8/13', { align: 'center' });
    doc.fontSize(7.5).text('(ISSUED UNDER SECTION 12/17 OF THE REGISTRATION OF BIRTHS & DEATHS ACT. 1969 AND RULE 8/13 OF THE PRADESH REGISTRATION OF BIRTHS & DEATHS RULES 2002)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(7.5).text('IS TO CERTIFY THAT THE FOLLOWING INFORMATION HAS BEEN TAKEN FROM THE ORIGINAL RECORD OF BIRTH WHICH IS THE REGISTER FOR GRAMA PANCHAYAT CHANDPURPHERU OF TAHSIL\'BLOCK BIJNOR OF DISTRICT BIJNOR OF STATE/UNION TERRITORY UTTAR PRADESH. INDIA', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(7.5).text('THIS IS TO CERTIFY THAT THE FOLLOWING INFORMATION HAS BEEN TAKEN FROM THE ORIGINAL RECORD OF BIRTH WHICH IS THE REGISTER FOR GRAMA PANCHAYAT CHANDPURPHERU OF TAHSIL/BLOCK BIJNOR OF DISTRICT BIJNOR OF STATE/UNION TERRITORY UTTAR PRADESH INDIA', { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(14).text('Birth Certificate', { align: 'center' });

    doc.moveDown(3);

    const leftMargin = 50;
    const rightMargin = doc.page.width - 70;
    let currentY = doc.y;

    doc.fontSize(7.5);

    // Define an array of data pairs: [leftText, rightText]
    const dataPairs = [
        [`NAME: ${formData['child-name']}`, `SEX: ${formData.gender}`],
        [`DATE OF BIRTH: ${formData['dob-numbers']} (${formData['dob-words']})`, `PLACE OF BIRTH: ${formData['place-of-birth']}`],
        [`NAME OF MOTHER: ${formData['mother-name']}`, `MOTHER'S AADHAAR NO: ${formData['mother-aadhaar']}`],
        [`NAME OF FATHER: ${formData['father-name']}`, `FATHER'S AADHAAR NO: ${formData['father-aadhaar']}`],
        [`ADDRESS OF PARENTS AT THE TIME OF BIRTH OF THE CHILD: ${formData['address-at-birth']}`, `PERMANENT ADDRESS OF PARENTS: ${formData['permanent-address']}`],
        [`REGISTRATION NUMBER: ${formData['registration-number']}`, `DATE OF REGISTRATION: ${formData['registration-date']}`],
        [`REMARKS (IF ANY): ---`, `Date of Issue: ${new Date().toLocaleDateString()}`],
       
        [``, `Issuing Authority: Registrar (Birth & Death)`] // Leave a blank space for alignment
        
    ];
    // doc.fontSize(7.5).text(`Issuing Authority: Registrar (Birth & Death)`);
    

    dataPairs.forEach(pair => {
        doc.text(pair[0], leftMargin, currentY, { align: 'left' });
        doc.text(pair[1], rightMargin - doc.widthOfString(pair[1]), currentY, { align: 'right' });
        currentY += Math.max(doc.heightOfString(pair[0]), doc.heightOfString(pair[1])) + 1.5; // Adjust vertical spacing
    });

    
  
    const centerImagePath2 = path.join(__dirname, 'i3.jpg');
    if (fs.existsSync(centerImagePath2)) {
        const centerImageWidth = 50; // Adjust the width as needed
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const rightImageX = pageWidth - centerImageWidth - 90; // 10 is the margin from the right edge
        const bottomImageY = pageHeight - 50 - 400; // 50 is the height of the image, 10 is the margin from the bottom edge
        doc.image(centerImagePath2, rightImageX, bottomImageY, { width: centerImageWidth });
    }
    const centerImagePath3 = path.join(__dirname, 'i5.jpg');
    if (fs.existsSync(centerImagePath3)) {
        const centerImageWidth = 150; // Adjust the width as needed
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const rightImageX = pageWidth - centerImageWidth - 50; // 10 is the margin from the right edge
        const bottomImageY = pageHeight - 50 - 350; // 50 is the height of the image, 10 is the margin from the bottom edge
        doc.image(centerImagePath3, rightImageX, bottomImageY, { width: centerImageWidth });
    }


    
    
    // doc.fontSize(7.5).text(`THIS IS A COMPUTER GENERATED CERTIFICATE WHICH CONTAINS FACSIMILE SIGNATURE OF THE ISSUING AUTHORITY. THE GOVT OF INDIA VIDE CIRCULAR NO. 1/12/2014-VS(CRS) DATED 27-JULY-2015 HAS APPROVED THIS CERTIFICATE AS A VALID LEGAL DOCUMENT FOR ALL OFFICIAL PUR;POSES.`, { align: 'bottom' })
    // doc.fontSize(7.5).text(`UPDATED ON: ${new Date().toLocaleString()}`);

    // Generate QR code
    const qrData = `Name: ${formData['child-name']}\nSex: ${formData.gender}\nDate of Birth: ${formData['dob-numbers']} (${formData['dob-words']})\nPlace of Birth: ${formData['place-of-birth']}\nRegistration Number: ${formData['registration-number']}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Add QR code to the PDF
    const qrCodeX = doc.page.width - 600;
const qrCodeY = doc.page.height - 250;
const qrCodeWidth = 50;
const qrCodeHeight = 50;

// Calculate the position for the text to be above the QR code
const textX = qrCodeX;
const textY = qrCodeY - 10; // Adjust this value as needed to provide space between the text and QR code

// Draw the text
doc.fontSize(7.5).text(`UPDATED ON: ${new Date().toLocaleString()}`, textX, textY);

// Draw the QR code
doc.image(qrCode, qrCodeX, qrCodeY, { fit: [qrCodeWidth, qrCodeHeight], align: 'center', valign: 'center' });


// Draw the text
const text = `THIS IS A COMPUTER GENERATED CERTIFICATE WHICH CONTAINS FACSIMILE SIGNATURE OF THE ISSUING AUTHORITY. THE GOVT OF INDIA VIDE CIRCULAR NO. 1/12/2014-VS(CRS) DATED 27-JULY-2015 HAS APPROVED THIS CERTIFICATE AS A VALID LEGAL DOCUMENT FOR ALL OFFICIAL PURPOSES.`;
doc.fontSize(7.5).text(text, 2, textY+60, { align: 'center', width: doc.page.width });


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
