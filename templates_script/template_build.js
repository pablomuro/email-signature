const Template = {
  data() {
    return {
      name: "Your Name",
      profession: "Your Profession",
      location: "Your Location",
      phone: "Your Phone",
      email: "Your E-mail",
      website: "Your Website"
    }
  },
  mounted() {
    let _this = this
    fetchData()
    function fetchData() {
      return fetch('../data.json', {
        method: 'get',
        headers: {
          'content-type': 'application/json'
        },
        mode: 'no-cors'
      })
        .then(res => {
          if (!res.ok) {
            const error = new Error(res.statusText);
            error.json = res.json();
            throw error;
          }

          return res.json();
        })
        .then(json => {
          // console.log(_this)
          _this.name = json.name
          _this.profession = json.profession
          _this.location = json.location
          _this.phone = json.phone
          _this.email = json.email
          _this.website = json.website
        })
        .catch(console.log)
    }
  }
}

Vue.createApp(Template).mount('table.back-table')