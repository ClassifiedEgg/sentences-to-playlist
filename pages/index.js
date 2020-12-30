import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import TrackCard from '../components/TrackCard';
import { useSpring, animated } from 'react-spring';
import { Box, Input, Center, Button, IconButton, Spinner, Text, Icon, useToast, useColorMode } from "@chakra-ui/react";
import { useRouter } from 'next/router';
import { BsCaretLeftFill, BsCaretRightFill, BsDownload, BsInfoCircle } from "react-icons/bs";
import { FaGithub, FaSun, FaMoon } from "react-icons/fa";

const mstoMin = (ms) => {
  var minutes = Math.floor(ms / 60000);
  var seconds = ((ms % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
};

const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';
const SPOTIFY_BASE_URL = 'https://api.spotify.com';

const Home = () => {
  const router = useRouter();
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [indices, setIndices] = useState([]);
  const [user, setUser] = useState([]);

  const errorToast = (desc) => (toast({
    title: 'There was an error. \u{1F625}',
    description: desc ?? "Please try again later.",
    status: "error",
    duration: 5000,
    isClosable: true,
  }));

  const props = useSpring({
    to: { opacity: 1, transform: 'translateY(0px)' },
    from: { opacity: 0, transform: 'translateY(-50px)' }
  });

  useEffect(() => {
    if (router.asPath.includes('access_token')) {
      let hash = router.asPath.replace('/#', '');
      router.replace('/');
      setToken(hash.split("&")[0].split("=")[1]);

      setLoading(true);

      try {
        (async () => {
          const res = await axios.get(`${SPOTIFY_BASE_URL}/v1/me`, {
            headers: {
              'Authorization': `Bearer ${hash.split("&")[0].split("=")[1]}`
            }
          });

          setUser(res.data);
        })();
      } catch (err) {
        errorToast();
      }

      setLoading(false);
    }
  }, []);

  const searchTracks = async (str) => (
    await axios.get(`${SPOTIFY_BASE_URL}/v1/search`, {
      params: {
        q: `"${encodeURIComponent(str)}"`,
        type: "track",
        market: "US"
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  );

  const onClick = async () => {
    setLoading(true);

    try {
      let wordsArr = text
        .trim()
        .replace(/  +/g, ' ')
        .replace(/[^a-zA-Z, ]/g, "")
        .split(",")
        .map(word => word.trim())
        .filter(word => word);

      setIndices(Array(wordsArr.length).fill(0));

      let res = await Promise.all(wordsArr.map(word => searchTracks(word)));

      setList(res.map(({ data }) => data.tracks));
    } catch (error) {
      errorToast();
    }

    setLoading(false);
  };

  const changeInd = (ind, byLength) => {
    setIndices(prevInd => {
      let newIndList = [...prevInd];
      newIndList[ind] = newIndList[ind] + byLength;
      return newIndList;
    });
  };

  const getMoreTracks = async (word, ind) => {
    try {
      let res = await axios.get(word.next, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setList(prevList => {
        let newList = [...prevList];
        newList[ind].items = [...word.items, ...res.data.tracks.items];
        newList[ind].next = res.data.tracks.next;
        return newList;
      });
    } catch (error) {
      errorToast();
    }
  };

  const creatPlaylist = async () => {
    try {
      setLoading('Creating Playlist');

      const playlist = await axios.post(`${SPOTIFY_BASE_URL}/v1/users/${user.id}/playlists`, { name },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

      toast({
        title: `${name} created \u{1F604}`,
        description: "Your playlist was successfully created!",
        status: "success",
        duration: 5000,
        isClosable: true
      });

      await axios.post(`${SPOTIFY_BASE_URL}/v1/playlists/${playlist.data.id}/tracks`, {},
        {
          params: {
            uris: list.map((tracks, ind) => tracks.items[indices[ind]].uri).join(',')
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

      setLoading('Adding Tracks');

      toast({
        title: "Tracks added \u{1F389}",
        description: "Selected tracks have been added to the playlist!",
        status: "success",
        duration: 5000,
        isClosable: true
      });
    } catch (err) {
      errorToast();
    }
    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Sentence To Playlist</title>
        <html lang="en" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Sentence To Playlist lets you convert any sentence to a playlist. Have fun creating playlists for you and your friends!" />
      </Head>

      <Box minH="100vh" pos="relative" paddingBottom="50px">

        <animated.div style={props}>
          <Box textAlign="center" fontWeight="700" paddingTop="20px" fontSize="4rem">
            Sentences to Playlist
        </Box>
          <Box textAlign="center" paddingTop="20px" fontSize="1.2rem" marginBottom='5px'>
            Convert any sentence you want into a Spotify playlist
        </Box>
          <Center>
            <Input
              placeholder={token ? "Enter your sentence here..." : "Log in to start creating playlists"}
              size="lg"
              width="50%"
              aria-label={token ? "Enter your sentence here..." : "Log in to start creating playlists"}
              value={text}
              disabled={!token}
              onChange={e => setText(e.target.value)}
              onKeyPress={e => {
                if (e.key === "Enter")
                  onClick();
              }} />
          </Center>

          {
            token &&
            <Center color="GrayText" alignItems="center">
              <Icon as={BsInfoCircle} w={4} marginRight="5px" height='100%' />
              <Text textAlign="center" marginTop="2px">Use comma ',' as a seperator</Text>
            </Center>
          }

          <Center marginTop="15px" marginBottom="15px">
            {
              token ?
                <Button disabled={!text || loading} onClick={onClick} name="Find Tracks">Find Tracks!</Button> :
                <Button onClick={async (e) => {
                  router.push(`${SPOTIFY_ACCOUNTS_URL}/authorize?client_id=${process.env.NEXT_PUBLIC_CLIENTID}&response_type=token&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_RECIRECT)}&scope=playlist-modify-public`);
                }}
                  name="Log Into Spotify">
                  Log Into Spotify!
          </Button>
            }
          </Center>
        </animated.div>

        <Center flexDirection="column">
          {list.length === indices.length ?
            list.map((word, ind) => {
              return (
                <Center key={ind}>
                  <IconButton
                    icon={<BsCaretLeftFill />}
                    marginRight="45px"
                    aria-label="Previous Track"
                    title="Previous Track"
                    disabled={indices[ind] === 0 || !word.items || word.items.length === 0}
                    onClick={() => changeInd(ind, -1)} />
                  {word.items && word.items.length !== 0 ?
                    <TrackCard
                      trackName={word.items[indices[ind]].name}
                      trackDuration={mstoMin(word.items[indices[ind]].duration_ms)}
                      artistName={word.items[indices[ind]].artists[0].name}
                      albumName={word.items[indices[ind]].album.name}
                      albumCover={word.items[indices[ind]].album.images[0].url} />
                    : 'No tracks found'}
                  <IconButton
                    icon={<BsCaretRightFill />}
                    marginLeft="45px"
                    aria-label="Next Track"
                    title="Next Track"
                    onClick={() => changeInd(ind, +1)}
                    disabled={indices[ind] === word.items.length - 1 || !word.items || word.items.length === 0}
                  />
                  <IconButton
                    icon={<BsDownload />}
                    marginLeft="10px"
                    aria-label="Get More Tracks"
                    title="Get More Tracks"
                    onClick={() => getMoreTracks(word, ind)}
                    disabled={word.items.length >= word.total || !word.items || word.items.length === 0}
                  />
                </Center>
              );
            }) : <Spinner marginTop='15px' />}
        </Center>

        {
          list.length > 0 &&
          <Box marginBottom="20px">
            <Center marginTop="15px" display="flex" flexDirection="column">
              <Input placeholder="Playlist Name" size="md" width="25%"
                display='block'
                value={name}
                onChange={e => setName(e.target.value)} />
              <Button
                disabled={!name || loading}
                size="md"
                display='block'
                marginTop="10px"
                onClick={() => creatPlaylist()}>
                {loading === ('Creating Playlist' || 'Adding Tracks') ?
                  <>
                    {loading}
                    <Spinner size="xs" marginLeft="5px" />
                  </>
                  :
                  <>
                    Create Playlist!
                  </>
                }
              </Button>
            </Center>
          </Box>
        }

        <Box position="absolute" h="50px" bottom="0" width="100%" marginBottom="5px">
          <Center>
            <IconButton
              aria-label={colorMode === "dark" ? "Light Mode" : "Dark Mode"}
              variant="ghost"
              size="lg"
              icon={colorMode === "dark" ? <FaSun /> : <FaMoon />}
              onClick={() => toggleColorMode()}
              marginRight='10px' />
            <IconButton
              aria-label="Github Repo"
              variant="ghost"
              size="lg"
              icon={<FaGithub />}
              onClick={() => router.push("https://github.com/ClassifiedEgg/sentences-to-playlist")}
              marginLeft='10px' />
          </Center>
        </Box>

      </Box>
    </div>
  );
};

export default Home;