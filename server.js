const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors middleware


const puppeteer = require('puppeteer');
const readline = require('readline')
const fs = require('fs') 
let bestItem2 = []
async function run(link) {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    if (!page.isClosed()) {
      await page.goto("https://www.amazon.com/s?k="+link+"&crid=1MJSSNCUE5H53&sprefix=t%2Caps%2C132&ref=nb_sb_noss_2");

      // Use a more specific selector for product nodes
      const products = await page.evaluate(() => {
        const productNodes = document.querySelectorAll('.s-result-item');
        const productArray = [];
        for (const node of productNodes) {
          const title = node.querySelector('h2 span')?.textContent || 'N/A';
          let price = node.querySelector('.a-offscreen')?.textContent || 'N/A';
          const OGPrice = node.querySelector('.a-text-price')?.textContent || 'N/A';
          const linkElement = node.querySelector('.a-link-normal')
          const link = linkElement ? linkElement.href : 'N/A';
           // Parsing prices using a more robust method
          const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
          const numericOGPrice = parseFloat(OGPrice.replace(/[^\d.]/g, ''));
          let fraction = ((numericOGPrice - numericPrice) / numericOGPrice) * 100;
          fraction = Math.floor(fraction)
          if (fraction === null) {
            fraction = 0;
          }
          productArray.push({ title, price, OGPrice, fraction, link });
        }
        return productArray;
      });
      let maxFraction = -1;
      let lowestPrice = 10000;
      let bestItem = null;
      let cheapestItem = null;
      for (const product of products) {
        if (product.fraction > maxFraction) {
            maxFraction = product.fraction;
            bestItem = product;
        }
      }
      for (const product of products) {
        if (isNaN(parseFloat(product.price.replace(/[^\d.]/g, ''))) !== false) {
        } else {
          if (parseFloat(product.price.replace(/[^\d.]/g, '')) < lowestPrice) {
            lowestPrice = parseFloat(product.price.replace(/[^\d.]/g, ''))
            cheapestItem = product
          }
        }
      } 
      console.log('Best Item:', bestItem);      
      console.log('Cheapet Item:', cheapestItem);
      bestItem2 = bestItem
      return(bestItem)
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Ensure the browser is closed even if an error occurs
    await browser.close();
  }
}



const app = express();
const port = 5500;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/run-command', (req, res) => {
  const { commandVariable } = req.body;

  if (!commandVariable) {
    return res.status(400).send('Missing commandVariable in form submission');
  }

  exec(`echo ${commandVariable}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).send('Internal Server Error');
    }
    run(stdout)
    console.log(`Command output: ${stdout}`);
    setTimeout(() => {
        res.send(`Command result:` + JSON.stringify(bestItem2));
    }, 10000);
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
