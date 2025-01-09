<template>
  <div>
    <input id="search" placeholder="Search" v-model="search" />
    <br>
    <br>
    <table v-if="showEdit">
      <tr>
        <th>Image</th>
        <th>Text</th>
        <th>Save</th>
      </tr>
      <tr>
        <td><img v-bind:src="this.editElement.img"></td>
        <td><textarea type="text" v-model="this.editElement.description"></textarea></td>
        <td><button v-on:click="save()">Save</button></td>
      </tr>
      <tr v-for="entry in history">
        <td>{{ entry.timestamp }}</td>
        <td>{{ entry.description }}</td>
        <td><button v-on:click="enterText(entry.id)">Übernehmen</button></td>
      </tr>
    </table>
    <br>
    <br>

    <table>
      <tr>
        <th>Image</th>
        <th>Text</th>
        <th>Edit</th>
      </tr>
      <tr v-for="zettel in zettelList" :key="zettel.id">
        <td><img v-bind:src="zettel.img"></td>
        <td v-html="zettel.descriptionShow"></td>
        <td class="button"><button v-on:click="edit(zettel.id)">Edit</button></td>
      </tr>
    </table>
  </div>

</template>

<style>

table textarea {
  width: 100%;
  height: 400px;
  padding: 12px 20px;
  margin: 8px 0;
  box-sizing: border-box;
  border: 2px solid #ccc;
  border-radius: 4px;
  background-color: #f8f8f8;
  resize: none;
  font-size: 16px;
  font-family: Arial, sans-serif;
}

#search {
  margin-top: 50px;
  width: 80vw;
  height: 5vh;
  font-size: 16px;
  padding: 12px 20px;
  margin: 8px 0;
  box-sizing: border-box;
  border-radius: 4px;
}

table, th, td {
  width: 80vw;
  border-collapse: collapse;
  border: solid 1px blue;
  border-width: 4px;
}

th, td {
  padding: 10px;
  text-align: left;
}

th {
  background-color: blue;
}

img {
  width: 500px;
}

button {
  background-color: blue;
  color: white;
  padding: 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
  border: none;
  width: 100%;
}

.button {
  text-align: center;
}

.searched-word {
  font-weight: bold;
}



</style>
<script>
import axios from 'axios';

export default {
  data() {
    return {
      search: "",
      zettelList: [],
      showEdit: false,
      editElement: null,
      history: [],
    };
  },
  methods:
  {
    async edit(id) {
      console.log("Edit", id);
      this.editElement = this.zettelList.find((zettel) => zettel.id == id);
      this.showEdit = true;
      this.history = await getHistory(this.editElement.id);
    },
    save() {
      console.log("Save", this.editElement.id);
      patchZettel(this.editElement.id, this.editElement.description, this.editElement.description_old);
      this.showEdit = false;
    },
    enterText(id) {
      let element = this.history.filter(item => item.id == id)[0];
      console.log(element);
      this.editElement.description = element.description;
    }
  },
  watch: {
    search: async function (val) {
          this.zettelList = await getZettelList(val);
    },
  },
};

export async function getZettelList(val) {
  const response = await axios.get('http://localhost:5000/cat-search/' + val,{}); 
  console.log(response.data);
  let data = await response.data;
  data = data.slice(0, 30);
  data = data.map((zettel) => {
    zettel.img = "http://webapp.uibk.ac.at/ubi/cat/" + zettel.thumb;
    zettel.descriptionShow = zettel.description;
        zettel.descriptionShow = zettel.descriptionShow.replace(new RegExp(`${val}`, 'gi'), match => {
          return '<span class="searched-word">' + match + '</span>';
        });
        zettel.description_old = zettel.description;
        return zettel;
          });
  return data;
}

export async function patchZettel(id, description, description_old) {
  const response = await axios.patch('http://localhost:5000/cat-item/' + id, {
    params: {
      description: description
    }
  });

  console.log(response.data);

  const response2 = await axios.put('http://localhost:5000/cat-history/' + id, {
    params: {
      description: description_old,
      catalog_id: id
    }
  });
  console.log(response2.data);
}

export async function getHistory(id) {
  const response = await axios.get('http://localhost:5000/cat-history/' + id);
  return await response.data; 
}

</script>