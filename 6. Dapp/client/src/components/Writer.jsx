import React, {useEffect, useState} from 'react';
import contractStore from "../stores/contract";

let intervalIdle;
let intervalWriting
let lastProposal;
const audio = new Audio('sound.mp3');
audio.loop = true;

function Writer(props) {
    const [content, setContent] = useState(null);

    useEffect(() => {
        if (props.data === '' || props.data === null) {
            return;
        }

        const intervalWritingTiming = 70;
        const intervalIdleTiming = 600;
        const pointer = '▓';
        let index = 0;

        clearInterval(intervalWriting);
        clearInterval(intervalIdle);
        intervalWriting = window.setInterval(() => {
            audio.play();
            setContent(props.data.substr(0, index) + pointer);

            if (index === props.data.length) {
                lastProposal = props.data;
                audio.pause();
                audio.currentTime = 0;
                contractStore.setState({log: null });
                window.clearInterval(intervalWriting);
                let lastPointer = '';
                intervalIdle = window.setInterval(() => {
                    if (lastPointer === '') {
                        lastPointer = pointer;
                    } else {
                        lastPointer = '';
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
