/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { ComponentProps } from 'react';
import { Chip as MaterialChip, makeStyles } from '@material-ui/core';

import { BackstageTheme } from '@backstage/theme';

type Props = ComponentProps<typeof MaterialChip>;

const isSmall = (size: Props['size']) => size === 'small';

const useStyles = makeStyles<BackstageTheme, { size: Props['size'] }>(
  theme => ({
    chip: {
      '& > span': {
        color: theme.palette.grey[900],
        lineHeight: `${theme.spacing(2.5)}px`,
        fontWeight: theme.typography.fontWeightMedium,
        fontSize: ({ size }) =>
          `${theme.spacing(isSmall(size) ? 1.5 : 1.75)}px`,
      },
      '& > svg': {
        width: ({ size }) => `${theme.spacing(isSmall(size) ? 2 : 3)}px`,
        height: ({ size }) => `${theme.spacing(isSmall(size) ? 2 : 3)}px`,
        color: theme.palette.grey[500],
        margin: ({ size }) =>
          `0 ${theme.spacing(isSmall(size) ? 0.5 : 0.75)}px 0 -${theme.spacing(
            isSmall(size) ? 0.5 : 0.75,
          )}px`,
      },
      backgroundColor: '#D9D9D9',
    },
  }),
);

/**
 * Thin wrapper on top of material-ui's Chip component
 */
export const Chip = React.forwardRef<any, Props>((props, ref) => {
  const classes = useStyles({ size: props.size });
  return <MaterialChip className={classes.chip} ref={ref} {...props} />;
});
