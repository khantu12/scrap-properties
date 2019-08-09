// eslint-disable-next-line no-unused-vars
const app = new Vue({
  el: '#app',
  data: {
    id: 0,
    user_offers: [],
    offers: [],
    diffBTwo: ['http://google.com'],
  },
  methods: {
    getCookie(name) {
      const value = '; ' + document.cookie;
      const parts = value.split('; ' + name + '=');
      if (parts.length == 2) {
        return parts
          .pop()
          .split(';')
          .shift();
      }
    },
    async getUserOffers() {
      this.user_offers = await fetch('/api/users/' + this.id)
        .then((data) => data.json())
        .then((result) => result.value.offers);
    },
    async getOffers() {
      this.offers = await fetch('/api/offers/')
        .then((data) => data.json())
        .then((result) => result);
    },
    async difference() {
      const diff = (a, b) => {
        return a.filter((i) => {
          return b.indexOf(i) < 0;
        });
      };
      const diffReturn = diff(this.offers, this.user_offers);
      if (diffReturn.length != 0) {
        this.diffBTwo.push(...diffReturn);
        diffReturn.forEach((oneDiff) => {
          notify('New property', {
            body: 'Some body',
            onclick: () => {
              const win = window.open(oneDiff, '_blank');
              win.focus();
            },
          });
        });
        fetch('/update/users/' + this.id);
      }
    },
    async action() {
      this.id = await this.setLocalStorageId();
      await this.getOffers().then(() =>
        this.getUserOffers().then(() => this.difference())
      );
    },
    async setLocalStorageId() {
      const localId = localStorage.getItem('id');
      if (localId === undefined || localId === null || localId === '') {
        const id = await fetch('/api/get-last-id')
          .then((data) => data.json())
          .then((result) => +result);
        localStorage.setItem('id', id);
        await fetch('/api/make-user/' + id);
        return id;
      } else {
        return localId;
      }
    },
  },
  beforeMount() {
    this.action();
    setInterval(() => {
      this.action();
    }, 60000);
  },
});
