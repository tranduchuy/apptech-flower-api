import UrlParamsModel from '../models/url-param';

// Create combo category: url: '/danh-muc/combo'
async function createComboUrlParams() {
  let comboUrlParam = await UrlParamsModel.findOne({
    topic: 13,
    specialOccasion: null,
    design: null,
    floret: null,
    city: null,
    district: null,
    color: null,
    priceRange: null,
    customUrl: '',
    url: 'combo',
  });
  if (!comboUrlParam) {
    comboUrlParam = new UrlParamsModel({
      topic: 13,
      specialOccasion: null,
      design: null,
      floret: null,
      city: null,
      district: null,
      color: null,
      priceRange: null,
      customUrl: '',
      url: 'combo',
    });

    await comboUrlParam.save();
  }
}

// Create combo category: url: '/danh-muc/combo'
async function createCakeUrlParams() {
  let cakeUrlParam = await UrlParamsModel.findOne({
    topic: 14,
    specialOccasion: null,
    design: null,
    floret: null,
    city: null,
    district: null,
    color: null,
    priceRange: null,
    customUrl: '',
    url: 'combo',
  });
  if (!cakeUrlParam) {
    cakeUrlParam = new UrlParamsModel({
      topic: 14,
      specialOccasion: null,
      design: null,
      floret: null,
      city: null,
      district: null,
      color: null,
      priceRange: null,
      customUrl: '',
      url: 'banh-kem',
    });

    await cakeUrlParam.save();
  }
}

// Create gift category: url: '/danh-muc/qua-tang'
async function createGiftUrlParams() {
  let giftUrlParam = await UrlParamsModel.findOne({
    topic: 12,
    specialOccasion: null,
    design: null,
    floret: null,
    city: null,
    district: null,
    color: null,
    priceRange: null,
    customUrl: '',
    url: 'qua-tang',
  });
  if (!giftUrlParam) {
    giftUrlParam = new UrlParamsModel({
      topic: 12,
      specialOccasion: null,
      design: null,
      floret: null,
      city: null,
      district: null,
      color: null,
      priceRange: null,
      customUrl: '',
      url: 'qua-tang',
    });

    await giftUrlParam.save();
  }
}

export const run = async () => {
  await createComboUrlParams();
  await createGiftUrlParams();
  await createCakeUrlParams();
};
