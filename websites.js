exports.websites = {
  myhousing: {
    url: 'https://www.myhousing.nl',
    condition: './en/rent/',
    to_get: (href) => href.replace('.', 'https://www.myhousing.nl'),
  },
  friendlyhousing: {
    url: 'https://friendlyhousing.nl/en',
    condition: '/en/all-rentals/',
    to_get: (href) => 'https://www.friendlyhousing.nl' + href,
  },
  pararius: {
    url: 'https://www.pararius.com/apartments/eindhoven/room',
    condition: '/room-for-rent/eindhoven/',
    to_get: (href) => 'https://www.pararius.com' + href,
  },
  goethvastgoed: {
    url:
      'https://www.goethvastgoed.nl/en/Offers?filter=house_filter&_token=te3ya1t13XgF2RvL3XC9NTWMSvOiSPNCXlB6JgDe&city=Eindhoven&street=&postcode=&type=&room_no=0&delivery=0&available=&min_price=&max_price=',
    condition: 'https://www.goethvastgoed.nl/en/Offers/',
    to_get: (href) => href.split('?')[0],
  },
  // kamernet: {
  //   url: 'https://kamernet.nl/en/for-rent/room-eindhoven/',
  //   condition: 'https://kamernet.nl/en/for-rent/room-eindhoven/',
  //   to_get: (href) => href,
  // },
};
