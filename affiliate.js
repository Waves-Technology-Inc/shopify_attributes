const querystring = require('querystring');

function generateAffiliateLink (productUrl, discountCode, campaignId, affiliateCode) {
    const trackingParams = {
        source: 'source_test',
        campaign_id: campaignId,
        affiliate_id: affiliateCode,
        discount_code: discountCode,
    };

    const encodeParams = querystring.stringify(trackingParams);

    const affiliateLink = `${productUrl}?${encodeParams}`;

    console.log(affiliateLink);
    return affiliateLink;
};