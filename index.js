require('dotenv').config({ path: `./.env` });
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
// create folders 
if(!fs.existsSync(`${process.env.ROOT}`)){
    fs.mkdirSync(`${process.env.ROOT}`);
  }
  if(!fs.existsSync(`${process.env.OUTPUT}`)){
    fs.mkdirSync(`${process.env.OUTPUT}`);
  }
  if(!fs.existsSync(`${process.env.TEMP}`)){
    fs.mkdirSync(`${process.env.TEMP}`);
  }
// Values
  constants = {
    ROOT: process.env.ROOT,
    TEMP:  process.env.TEMP,
    OUTPUT:  process.env.OUTPUT,
    RESIZE_IMAGE_WIDTH: parseInt(process.env.RESIZE_IMAGE_WIDTH),
    JIMP_QUALITY: parseInt(process.env.JIMP_QUALITY),
    MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE), 
    RESIZE_HD_IMAGE_WIDTH: parseInt(process.env.RESIZE_HD_IMAGE_WIDTH),
    MEDIAN_HD_IMAGE_WIDTH: parseInt(process.env.MEDIAN_HD_IMAGE_WIDTH),
    MAX_HD_IMAGE_SIZE: parseInt(process.env.MAX_HD_IMAGE_SIZE)
  }

const root = constants.ROOT;
const destination = constants.TEMP;
const imageminOut = constants.OUTPUT; 
const opt = constants.OUTPUT;
const files = fs.readdirSync(root);
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const targetFiles = files.filter((file) => {
  return (
    path.extname(file).toLowerCase() === '.jpg' ||
    path.extname(file).toLowerCase() === '.png' ||
    path.extname(file).toLowerCase() === '.jpeg' ||
    path.extname(file).toLowerCase() === '.png' ||
    path.extname(file).toLowerCase() === '.webp' ||
    path.extname(file).toLowerCase() === '.svg' 
    );
});


console.log(targetFiles);
let data = {};
let count = 0;
targetFiles.forEach(image => {
  let filepath = root + '/' +image;
  let fileout = destination + '/' +image;
  let fileoptim = opt + '/' +image;
  // console.log('filepath', filepath);
  let dimensions = sizeOf(filepath);
  let filesize = fs.statSync(filepath);
  data[count] = {};
  data[count].filename = image;
  data[count].size = filesize['size'];
  data[count].filepath = filepath;
  data[count].destination = fileout;
  data[count].optimal = fileoptim;
  data[count].width = dimensions.width;
  data[count].extension =  path.extname(image).toLowerCase();
  if (image.includes('(')) {
    data[count].special = true;
  } else { data[count].special = false; }
  ++count;
});

for (let key in data) {
  // Jimp Resize Imagemin Compress
  if (data[key].width > constants.RESIZE_IMAGE_WIDTH && data[key].extension === '.png' && !data[key].special) {   
    if (data[key].size > constants.MAX_HD_IMAGE_SIZE && data[key].width < constants.MEDIAN_HD_IMAGE_WIDTH) {
      console.log('----------------');
      console.log(`Processing through JIMP + IMAGEMIN and resizing to ${constants.RESIZE_HD_IMAGE_WIDTH}px', ${data[key].filename}`);
      Jimp.read(data[key].filepath, (err, lenna) => {
        if (err) {console.log(err);} else{
        lenna
          .resize(constants.RESIZE_HD_IMAGE_WIDTH, Jimp.AUTO) // resize
          .writeAsync(data[key].destination)
          .then(async () => {
            await compress(data[key].destination, data[key].optimal);
          }) 
        }
      });
    } else {     
      console.log('----------------');
      console.log(`Processing through JIMP + IMAGEMIN and resizing to ${constants.RESIZE_IMAGE_WIDTH}px', ${data[key].filename}`);
      Jimp.read(data[key].filepath, (err, lenna) => {
        if (err) {console.log(err);} else{
        lenna
          .resize(constants.RESIZE_IMAGE_WIDTH, Jimp.AUTO) // resize
          .writeAsync(data[key].destination)
          .then(async () => {
            await compress(data[key].destination, data[key].optimal);
          }) 
        }
      });
    }
  }

  if (data[key].width > constants.RESIZE_IMAGE_WIDTH 
    && data[key].extension === '.png' && data[key].special) {
    if (data[key].size > constants.MAX_HD_IMAGE_SIZE 
      && data[key].width < constants.MEDIAN_HD_IMAGE_WIDTH) {
      JimpResizeCompress(data[key].filepath, constants.RESIZE_HD_IMAGE_WIDTH,data[key].optimal);     
    } else {
      JimpResizeCompress(data[key].filepath, constants.RESIZE_IMAGE_WIDTH,data[key].optimal);     
    }    
  }    

  if (data[key].width > constants.RESIZE_IMAGE_WIDTH 
    && data[key].extension !== '.png') {      
    if (data[key].size > constants.MAX_HD_IMAGE_SIZE 
      && data[key].width < constants.MEDIAN_HD_IMAGE_WIDTH) {
      JimpResizeCompress(data[key].filepath, constants.RESIZE_HD_IMAGE_WIDTH,data[key].optimal);     
    } else {
      JimpResizeCompress(data[key].filepath, constants.RESIZE_IMAGE_WIDTH,data[key].optimal);
    } 
  } 
  // Jimp Resize Imagemin Compress
  // Imagemin Compress -- DONE
  if (data[key].width <= constants.RESIZE_IMAGE_WIDTH && !data[key].special) {
    if (data[key].size > constants.MAX_IMAGE_SIZE && data[key].width > constants.RESIZE_HD_IMAGE_WIDTH) {
            console.log('----------------');
            console.log(`Processing through JIMP + IMAGEMIN and resizing to ${constants.RESIZE_HD_IMAGE_WIDTH}px', ${data[key].filename}`);
      Jimp.read(data[key].filepath, (err, lenna) => {
        if (err) {console.log(err);} else{
        lenna
          .resize(constants.RESIZE_HD_IMAGE_WIDTH, Jimp.AUTO) // resize
          .writeAsync(data[key].destination)
          .then(async () => {
            await compress(data[key].destination, data[key].optimal);
          }); 
        }
      });
    } else {
      // compress with imagemin
      compress(data[key].filepath, data[key].optimal);
    }   
  }

  if (data[key].width <= constants.RESIZE_IMAGE_WIDTH && data[key].special) {
    if (data[key].size > constants.MAX_IMAGE_SIZE && data[key].width > constants.RESIZE_HD_IMAGE_WIDTH) {
      // image in size target but too big
      JimpResizeCompress(data[key].filepath, constants.RESIZE_HD_IMAGE_WIDTH,data[key].optimal);
    } else {
      JimpCompress(data[key].filepath,data[key].optimal)
    }    
  }
}

// JimpResizeCompress
function JimpResizeCompress(filepath, resize,destination) {
  console.log('----------------');
  console.log(`Processing through JIMP and resizing to ${resize}px', ${filepath}`);
  Jimp.read(filepath, (err, image) => {
    if (err) {console.log(err);} else{
    image    
      .resize(resize, Jimp.AUTO) // resize
      .quality(constants.JIMP_QUALITY) // set JPEG quality
      .write(destination);
    }
  });
}



function JimpCompress(filepath, destination) {
  Jimp.read(filepath, (err, lenna) => {
    if (err) {console.log(err);} else{
    lenna    
      .quality(constants.JIMP_QUALITY) // set Image quality
      .write(destination);
    }
  });
}

// Imagemin compress
async function compress(filepath, altDest, min = 0.6, max = 0.8) {
  console.log('compressing through imagemin', filepath);
  console.log('image quality to reduce to', min, max);
  try {
    const files = await imagemin([`${filepath}`], {
      destination: imageminOut,
      plugins: [          
          imageminJpegtran(),
          imageminPngquant({
              quality: [min, max]
          })
      ]
  });
  } catch (e) {
    console.log('=================================');
    console.log('=================================');
    console.log('Failed in processing image', filepath);
    if (e.exitCode === 99) {
      console.log(Date.now(), 'Reprocessing image with JIMP instead', filepath);
      JimpCompress(filepath, altDest);
    }
  }
};
