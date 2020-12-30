import React from 'react';
import { useSpring, animated } from 'react-spring';
import { BsPerson, BsClock, BsMusicNoteList } from "react-icons/bs";
import { Box, Image, Text, Icon, Skeleton } from '@chakra-ui/react';

const calc = (x, y) => [-(y - window.innerHeight / 2) / 20, (x - window.innerWidth / 2) / 20, 1.1];
const trans = (x, y, s) => `perspective(600px) scale(${s})`;

const TrackCard = ({ trackName, artistName, albumName, albumCover, trackDuration }) => {

  const [props, set] = useSpring(() => ({ xys: [0, 0, 1] }));

  return (
    <animated.div
      onMouseMove={({ clientX: x, clientY: y }) => set({ xys: calc(x, y) })}
      onMouseLeave={() => set({ xys: [0, 0, 1] })}
      style={{ transform: props.xys.interpolate(trans) }}
    >
      <Box className="trackCard" display="flex" flexDirection="row" margin="10px 0px" width="400px">
        <Image height='110px' width='110px' src={albumCover} float="left" fallback={<Skeleton width='110px' height='110px' />} />
        <Box display="flex" flexDirection="column" paddingLeft="15px">
          <Box className="trackCardItems">
            <Text fontSize="20px" fontWeight="bold">
              {trackName}
            </Text>
          </Box>
          <Box className="trackCardItems">
            <Icon as={BsPerson} w={4} h={4} marginRight="5px" />
            <Text>
              {artistName}
            </Text>
          </Box>
          <Box className="trackCardItems">
            <Icon as={BsMusicNoteList} w={4} h={4} marginRight="5px" />
            <Text>
              {albumName}
            </Text>
          </Box>
          <Box className="trackCardItems">
            <Icon as={BsClock} w={4} h={4} marginRight="5px" />
            <Text>
              {trackDuration}
            </Text>
          </Box>
        </Box>
      </Box>
    </animated.div>
  );
};

export default TrackCard;
