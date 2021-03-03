const cheerio = require("cheerio");
const Nightmare = require("nightmare");
var opn = require("opn-url");
const {
  url,
  updateInterval,
  monthToSearch,
  upperThreshold,
  lowerThreshold,
  numbersToSend,
} = require("./properties.json");

const accountSid = "ACfb3cb516e6ca868f1d9c831ca7450918";
const authToken = "6220bed6f9d361915888fa763b69f374";
const client = require("twilio")(accountSid, authToken);

let newsCounter = 0;
let surpassThreshold = { upper: false, lower: false };

console.log("\n__Starting KMPH alert bot__");

const repeater = setInterval(() => scrapeContent(), updateInterval);

async function scrapeContent() {
  const nightmare = Nightmare({ show: false });
  nightmare
    .goto(url)
    .wait("body")
    .evaluate(() => document.querySelector("body").innerHTML)
    .end()
    .then((res) => checkData(res))
    .catch((err) => console.log(err));

  let checkData = (html) => {
    data = [];
    const $ = cheerio.load(html);

    checkForNews($);
    checkForLargePriceChanges($);
  };
}

function checkForNews($) {
  const newsTable = $(".nirtable > tbody > tr");
  newsTable.each(function () {
    const month = $(this).find(".datetime").text();
    if (month.includes(monthToSearch)) {
      // open the page in the browser if not yet opened
      if (newsCounter != 1) {
        opn.open(url);
        numbersToSend.forEach((number) => {
          client.messages
            .create({
              from: "+15632783509",
              body:
                "CHECK KMPH WEBSITE FOR NEW NEWS - https://investors.kempharm.com/investor-overview",
              to: number,
            })
            .then((message) => console.log(message.status))
            .done();
        });
        newsCounter = 1;
      }
      console.log("CHECK WEBSITE FOR NEW NEWS");
      return false;
    }
  });
}

function checkForLargePriceChanges($) {
  const price = $(".quote-price").text();
  if (parseFloat(price) > upperThreshold) {
    opn.open(url);
    if (!surpassThreshold.upper) {
      console.log("PRICE INCREASE");
      surpassThreshold.upper = true;
    }
  }
  if (parseFloat(price) < lowerThreshold) {
    opn.open(url);
    if (!surpassThreshold.lower) {
      console.log("PRICE DECREASE");
      surpassThreshold.lower = true;
    }
  }
  console.log("Current share price: ", price);
}
