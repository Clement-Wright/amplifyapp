import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Table,
  TableBody,
  Link,
  TableHead,
  TableRow,
  TableCell,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';

const App = ({ signOut, user }) => {
  const [notes, setNotes] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;

    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );

    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
      author: user.attributes.email,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className={`App ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="app-title">
        <Heading level={1} className={isDarkMode ? "dark-text" : ""}>
          Clement's Notes App
        </Heading>
      </div>
      <Button className={isDarkMode ? "dark-text" : ""} onClick={() => setIsDarkMode(!isDarkMode)}>
        Toggle Dark Mode
      </Button>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <div className="app-subtitle">
        <Heading level={5} className={isDarkMode ? "dark-text" : ""}>
          ATCS Notes
        </Heading>
      </div>
      <table border="0.5px" align="center">
        <tbody>
          <tr>
            <td>
              <p>
                <Heading level={5} className={isDarkMode ? "dark-text" : ""}>
                  Clement Wright ATCS Project
                </Heading>
              </p>
              <ul>
                <li ><a className={isDarkMode ? "dark-link" : ""} href="./LinksPage.html">HTML Links Page</a>.</li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell >
              <Heading level={6} className={isDarkMode ? "dark-text" : ""} as="strong" fontWeight="bold">Author</Heading>
            </TableCell>
            <TableCell>
            <Heading level={6} className={isDarkMode ? "dark-text" : ""} as="strong" fontWeight="bold">Note Name</Heading>
            </TableCell>
            <TableCell>
            <Heading level={6} className={isDarkMode ? "dark-text" : ""} as="strong" fontWeight="bold">Description</Heading>
            </TableCell>
            <TableCell>
            <Heading level={6} className={isDarkMode ? "dark-text" : ""} as="strong" fontWeight="bold">Image</Heading>
            </TableCell>
            <TableCell>
            <Heading level={6} className={isDarkMode ? "dark-text" : ""} as="strong" fontWeight="bold">Delete</Heading>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notes.map((note) => (
            <TableRow key={note.id || note.name}>
              <TableCell className={isDarkMode ? "dark-text" : ""}>
                {note.author}
              </TableCell>
              <TableCell className={isDarkMode ? "dark-text" : ""}>
                {note.name}
              </TableCell>
              <TableCell className={isDarkMode ? "dark-text" : ""}>
                {note.description}
              </TableCell>
              <TableCell>
                {note.image && (
                  <Image
                    src={note.image}
                    alt={`visual aid for ${note.name}`}
                    style={{ width: "150px" }}
                  />
                )}
              </TableCell>
              <TableCell>
                <Button variation="link" onClick={() => deleteNote(note)}>
                  <Text
                    as="strong"
                    fontSize={10}
                    color={isDarkMode ? "#ffffff" : "#ff6600"}
                  >
                    Delete
                  </Text>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={signOut} className={isDarkMode ? "dark-text" : ""}>
        Sign Out
      </Button>
    </View>
  );
};

export default withAuthenticator(App);
