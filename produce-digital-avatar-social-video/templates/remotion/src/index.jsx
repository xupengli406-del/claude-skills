import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Film} from './Film';
import project from './project.json';
const Root=()=> <Composition id="Explainer" component={Film} width={1080} height={1920} fps={project.fps} durationInFrames={Math.round(project.duration*project.fps)} defaultProps={{project}}/>;
registerRoot(Root);
