import React, {useEffect, useState} from 'react';
import contractStore from "../stores/contract";
import appStore from "../stores/app";

let intervalIdle;
let intervalWriting
let lastProposal;
const audio = new Audio('sound.mp3');
audio.loop = true;

function Writer({ data, soundProp = true, animationProp = true}) {
    const props = {
        sound: soundProp,
        animation: animationProp,
        data
    }

    const [content, setContent] = useState(null);
    const [sound, setSound] = useState(false);
    const [animation, setAnimation] = useState(false);
    const storeSound = appStore(state => ({ sound: state.sound }));

    useEffect(() => {
        setSound(storeSound && props.sound);
        setAnimation(props.animation);
    }, [storeSound, props.sound, props.animation])

    useEffect(() => {
        if (props.data === '' || props.data === null) {
            return;
        }

        const pointer = '▓';

        if (!animation) {
            setContent(props.data + pointer);
            return;
        }

        const intervalWritingTiming = 70;
        const intervalIdleTiming = 600;
        let index = 0;

        clearInterval(intervalWriting);
        clearInterval(intervalIdle);
        intervalWriting = window.setInterval(() => {
            if(sound) {
                audio.play();
            }
            setContent(props.data.substr(0, index) + pointer);

            if (index === props.data.length) {
                lastProposal = props.data;
                audio.pause();
                audio.currentTime = 0;
                contractStore.setState({log: null });
                window.clearInterval(intervalWriting);
                let lastPointer = '';
                intervalIdle = window.setInterval(() => {
                    if (lastPointer === ' ') {
                        lastPointer = pointer;
                    } else {
                        lastPointer = ' ';
                    }
                    setContent(lastProposal + lastPointer);
                }, intervalIdleTiming);
            }
            index++;
        }, intervalWritingTiming);

    }, [props.data]);

    if (content === null) {
        return (<></>);
    }

    return (
        <>
            {content}
        </>
    );
}

export default Writer;
