function generateRandomHash(length) {
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var hash = "";
  for (var i = 0; i < length; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
}

async function sendDataToServer(data) {
  var serverEndpointURL = "https://qsxpesu9m8.execute-api.us-east-1.amazonaws.com/dev/affiliate/event";

  fetch(serverEndpointURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Data sent to server.");
      } else {
        console.error("Failed to send data to server.");
      }
    })
    .catch((error) => {
      console.error("Error sending data:", error);
    });
}

async function getNetworkData() {
  try {
    const response = await fetch("https://ipinfo.io/json");
    if (!response.ok) {
      throw new Error("Network request failed");
    }

    const data = await response.json();

    const networkData = {
      ipAddress: data.ip,
      city: data.city,
      region: data.region,
      country: data.country,
      postalCode: data.postal,
      org: data.org,
      timezone: data.timezone,
    };

    return networkData;
  } catch (error) {
    console.error("Error fetching network data:", error);
  }
}

async function getBrowserData() {
  const browser_data = {
    userAgent: window.navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    innerHeight: window.innerHeight,
    width: window.innerWidth,
    outerHeight: window.outerHeight,
    outerWidth: window.outerWidth,
    screenX: window.screenX,
    screenY: window.screenY,
    windowOrigin: window.origin,
    windowLocation: window.location,
    platform: window.navigator.platform,
    appCodeName: window.navigator.appCodeName,
    cookies: document.cookie,
    language: window.navigator.language,
    localStorage: Object.assign(
      {},
      ...Array.from({ length: localStorage.length }, (_, i) => ({
        [localStorage.key(i) ?? ""]: localStorage.getItem(localStorage.key(i) ?? ""),
      }))
    ),
    sessionStorage: Object.assign(
      {},
      ...Array.from({ length: sessionStorage.length }, (_, i) => ({
        [sessionStorage.key(i) ?? ""]: sessionStorage.getItem(sessionStorage.key(i) ?? ""),
      }))
    ),
    network: await getNetworkData(),
  };

  return browser_data;
}

async function trackEventAndSendData(eventName, eventData) {
  sendDataToServer({
    event_name: eventName,
    event_data: eventData,
    shopifyStore: window.location.host,
    offerId: sessionStorage.getItem("campaignId") ?? "",
    browserUserId: localStorage.getItem("userId") ?? generateRandomHash(10),
    affiliateId: localStorage.getItem("affiliateId") ?? "",
    browserData: await getBrowserData(),
  });
}

function getAffiliateParamsFromURL() {
  var urlParams = new URLSearchParams(window.location.search);
  var affiliateParams = {};

  // Replace with the actual parameter names you're using for affiliates
  affiliateParams.affiliateID = urlParams.get("affiliate_id");
  affiliateParams.campaignID = urlParams.get("campaign_id");
  affiliateParams.source = urlParams.get("source");
  affiliateParams.discountCode = urlParams.get("discount_code");

  return affiliateParams;
}

function initializePixel() {
  var userId = localStorage.getItem("userId") || generateRandomHash(10);
  var params = getAffiliateParamsFromURL();

  if (params.discountCode) {
    document.cookie = `discount_code=${params.discountCode}; path=/`;
  }

  if (params.campaignID) {
    sessionStorage.setItem("campaignId", params.campaignID);
  }

  // Set userId and affiliateId in sessionStorage on initial load
  localStorage.setItem("userId", userId);
  localStorage.setItem("affiliateId", params.affiliateID); // Replace with actual affiliate ID from URL
}

initializePixel();

analytics.subscribe("page_viewed", (event) => {
  trackEventAndSendData("track_page_viewed", {
    page_location: event.context.document.location.href,
    page_title: event.context.document.title,
  });
});

analytics.subscribe("product_viewed", (event) => {
  trackEventAndSendData("track_product_viewed", {
    product_id: event.data.productVariant.product.id,
    product_name: event.data.productVariant.product.title,
  });
});

analytics.subscribe("product_added_to_cart", async (event) => {
  if (event.data.cartLine.merchandise.price.amount > 0) {
    trackEventAndSendData("track_added_to_cart", {
      currency: event.data.cartLine.merchandise.price.currencyCode,
      value: event.data.cartLine.merchandise.price.amount,
      order_quantity: event.data.quantity,
      line_items: [
        {
          product_id: event.data.cartLine.merchandise.product.id,
          product_name: event.data.cartLine.merchandise.product.title,
          product_price: event.data.cartLine.merchandise.price.amount,
          product_quantity: event.data.quantity,
        },
      ],
    });
  }
});

analytics.subscribe("checkout_started", async (event) => {
  trackEventAndSendData("track_checkout_started", {
    currency: event.data.checkout.currencyCode,
    value: event.data.checkout.totalPrice.amount,
    items: event.data.checkout.lineItems,
  });
});

analytics.subscribe("checkout_completed", async (event) => {
  if (event.data.checkout.totalPrice.amount > 0) {
    let items = [];
    for (const item of event.data.checkout.lineItems) {
      items.push({
        product_id: item.variant.product.id,
        product_name: item.title,
        product_price: item.variant.price.amount,
        product_quantity: item.quantity,
      });
    }

    trackEventAndSendData("track_checkout_completed", {
      order_id: event.data.checkout.order.id,
      value: event.data.checkout.totalPrice.amount.toFixed(2),
      currency: event.data.checkout.totalPrice.currencyCode,
      order_quantity: items.length,
      line_items: items,
    });
  }
});