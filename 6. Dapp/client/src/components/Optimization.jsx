import React, {useEffect, useState} from 'react';
import Cookies from 'js-cookie';

/**
 * Enable or disable visual effect
 * This part is a bit ugly and should be moved somewhere else
 * @returns {JSX.Element}
 * @constructor
 */
function Optimization() {
    const [effect, setEffect] = useState(true);

    useEffect(() => {
        if(Cookies.get('no-effect')) {
            disableEffects();
        } else {
            enableEffects();
        }
    }, []);

    const handleClick = () => {
        if (effect === true) {
            disableEffects();
        } else {
            enableEffects();
        }
    }

    const enableEffects = () => {
        document.getElementsByTagName('body')[0].classList.add('animated');
        Cookies.remove('no-effect');
        setEffect(true);
    }

    const disableEffects = () => {
        document.getElementsByTagName('body')[0].classList.remove('animated');
        Cookies.set('no-effect', '1')
        setEffect(false);
    }

    return (
        <a onClick={handleClick} title="Disable visual effects" id="optimization-btn">{effect ? 'Disable effects' : 'Enable effects'}</a>
    );
}

export default Optimization;
