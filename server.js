const express = require('express');
const cookieParser = require('cookie-parser');
const cheerio = require('cheerio');
const rp = require('request-promise');
const axios = require('axios');
const websites = require('./websites.js').websites;
const cors = require('cors');

const getLastUser = () => {
  return axios
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

const getAllUserIds = () => {
  const allIds = [];
  return axios
    .get('https://js-scrap-properties.firebaseio.com/users.json')
    .then((res) => {
      const data = res.data;
      const usersValues = Object.values(data);
      for (let i = 0; i < usersValues.length; i++) {
        allIds.push(usersValues[i].id);
      }
      return allIds;
    });
};

const getUserById = (id) => {
  id = +id;
  return axios
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

const fetchOffer = (website) => {
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

const fetchOffers = () => {
  const values = Object.values(websites);
  return Promise.all([
    fetchOffer(values[0]),
    fetchOffer(values[1]),
    fetchOffer(values[2]),
    fetchOffer(values[3]),
  ]).then((result) => [].concat([], ...result));
};

const makeUser = async (id) => {
  const date = new Date();
  const time = date.getTime();
  axios.post('https://js-scrap-properties.firebaseio.com/users.json', {
    id: id,
    last_seen: time,
    offers: await getOffers(),
  });
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

const getOffers = () => {
  return axios
    .get('https://js-scrap-properties.firebaseio.com/websites.json')
    .then((res) => res.data)
    .then((data) => {
      const offers = Object.values(data)[1];
      return offers;
    });
};

const getLastUserId = async () => {
  return await getLastUser().then((user) => {
    const lastUserId = user.id;
    const id = lastUserId === undefined ? 1 : lastUserId + 1;
    return id;
  });
};

const app = express();
app.use(cors({origin: true}));
app.use(cookieParser());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.render('index.html', {});
});

app.get('/api/get-last-id', (req, res) => {
  getLastUserId().then((id) => res.send(JSON.stringify(id)));
});

app.get('/api/get-all-ids', (req, res) => {
  getAllUserIds().then((all) => res.send(JSON.stringify(all)));
});

app.get('/api/make-user/:id', (req, res) => {
  makeUser(+req.params.id);
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

app.listen(process.env.PORT, () => {
  fetchOffers().then((offers) => {
    updateWebsitesDatabase(offers);
  });
  setInterval(() => {
    fetchOffers().then((offers) => {
      updateWebsitesDatabase(offers);
    });
  }, 60000);
  console.log('running on port 3000');
});
