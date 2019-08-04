const express = require('express');
const cookieParser = require('cookie-parser');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const cheerio = require('cheerio');
const rp = require('request-promise');
const axios = require('axios');
const websites = require('./websites.js').websites;
const cors = require('cors');

const getLastUser = async () => {
  return await axios
    .get('https://js-scrap-properties.firebaseio.com/users.json')
    .then((res) => res.data)
    .then((data) => {
      if (data === undefined || data === null) return undefined;
      const keys = Object.keys(data);
      const lastKey = keys[keys.length - 1];
      const lastUser = data[lastKey];
      return lastUser;
    });
};

const getUserById = async (id) => {
  id = +id;
  return await axios
    .get('https://js-scrap-properties.firebaseio.com/users.json')
    .then((res) => {
      const data = res.data;
      const usersValues = Object.values(data);
      for (let i = 0; i < usersValues.length; i++) {
        if (usersValues[i].id === id) {
          const userKey = Object.keys(data)[i];
          const userValue = usersValues[i];
          return {
            key: userKey,
            value: userValue,
          };
        }
      }
    });
};

const fetchOffer = async (website) => {
  return rp({
    uri: website.url,
    transform: (body) => cheerio.load(body),
  }).then(($) => {
    const link = $('a[href*="' + website.condition + '"]');
    const properties = [];
    $(link).each((i, link) => {
      const href = $(link).attr('href');
      properties.push(website.to_get(href));
    });
    const list = [...new Set(properties)];
    return list;
  });
};

const fetchOffers = async () => {
  const values = Object.values(websites);
  return Promise.all([
    fetchOffer(values[0]),
    fetchOffer(values[1]),
    fetchOffer(values[2]),
    fetchOffer(values[3]),
  ]).then((result) => [].concat([], ...result));
};

const makeUser = (id) => {
  const date = new Date();
  const time = date.getTime();
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open(
    'POST',
    'https://js-scrap-properties.firebaseio.com/users.json',
    true
  );
  xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  const data = {
    id: id,
    last_seen: time,
    offers: '',
  };
  xmlhttp.send(JSON.stringify(data));
};

const updateUser = (key, offers) => {
  const date = new Date();
  const time = date.getTime();
  const data = {};
  data['last_seen'] = time;
  data['offers'] = offers;
  const send = JSON.stringify(data);
  axios.patch(
    'https://js-scrap-properties.firebaseio.com/users/' + key + '.json',
    send
  );
};

const updateWebsitesDatabase = (offers) => {
  const date = new Date();
  const time = date.getTime();
  const data = JSON.stringify({
    last_seen: time,
    offers: offers,
  });
  axios.put('https://js-scrap-properties.firebaseio.com/websites.json', data);
};

const getOffers = async () => {
  return await axios
    .get('https://js-scrap-properties.firebaseio.com/websites.json')
    .then((res) => res.data)
    .then((data) => {
      const offers = Object.values(data)[1];
      return offers;
    });
};

const app = express();
app.use(cors({origin: true}));
app.use(cookieParser());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const cookie = req.cookies.id;
  if (cookie === undefined) {
    getLastUser().then((user) => {
      const lastUserId = user.id;
      const id = lastUserId === undefined ? 1 : lastUserId + 1;
      res.cookie('id', id, {
        expires: new Date(Date.now() + 900000),
        httpOnly: false,
        expires: false,
      });
      makeUser(id);
    });
  }
  res.render('index.html', {});
});

app.get('/api/users/:id', (req, res) => {
  getUserById(req.params.id).then((data) => res.send(data));
});

app.get('/api/offers', (req, res) => {
  getOffers().then((data) => res.send(data));
});

app.get('/update/users/:id', (req, res) => {
  getUserById(req.params.id).then((user) => {
    getOffers().then((offers) => {
      updateUser(user.key, offers);
      res.send('success');
    });
  });
});

app.listen(3000, () => {
  fetchOffers().then((offers) => {
    updateWebsitesDatabase(offers);
  });
  setInterval(() => {
    fetchOffers().then((offers) => {
      updateWebsitesDatabase(offers);
    });
  }, 60000);
  console.log('[*] Listening on localhost:3000');
});
