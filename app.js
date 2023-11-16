const puppeteer = require('puppeteer');
const readline = require('readline')
let link = ""
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question('What Product are you looking for on amazon?', name => {
  link = name
  console.log(name)
  run();

});
async function run() {
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
      function isNumber(value) {
        return typeof value === 'number';
      }
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

    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Ensure the browser is closed even if an error occurs
    await browser.close();
  }
}

