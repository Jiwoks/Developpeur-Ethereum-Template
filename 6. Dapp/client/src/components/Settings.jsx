import React, {useEffect} from 'react';
import appStore from '../stores/app.js';
import Cookies from 'js-cookie';

/**
 * Enable or disable visual effect
 *
 * @returns {JSX.Element}
 * @constructor
 */
function Settings() {
    const {sound, effects} = appStore(state => ({ sound: state.sound, effects: state.effects}));
    const {setSound, setEffects} = appStore(state => ({ setSound: state.setSound, setEffects: state.setEffects}));

    useEffect(() => {
        // fixme: This part should not be done here, but on top of the application
        const effectsEnabled = Cookies.get('no-effects') === undefined;
        const soundEnabled = Cookies.get('no-sound') === undefined;
        toggle('effects', effectsEnabled);
        setEffects(effectsEnabled);
        toggle('sound', soundEnabled);
        setSound(soundEnabled);
    }, []);

    const toggle = (type, value, e) => {
        if (e) {
            e.preventDefault()
        }
        if (type === 'effects') {
            if (value) {
                document.getElementsByTagName('body')[0].classList.add('animated');
            } else {
                document.getElementsByTagName('body')[0].classList.remove('animated');
            }
            setEffects(value);
        } else if (type === 'sound') {
            setSound(value);
        }

        if (value) {
            Cookies.remove('no-' + type);
        } else {
            Cookies.set('no-' + type, '1')
        }

    }

    return (
        <div id="settings">
            <h3>Settings</h3>
            <a href="#" onClick={(e) => toggle('effects', !effects, e)} className="setting-btn">Visual effect <span>{effects ? '[x]' : '[ ]'}</span></a>
            <a href="#" onClick={(e) => toggle('sound', !sound, e)} className="setting-btn">Sound <span>{sound ? '[x]' : '[ ]'}</span></a>
        </div>
    );
}

export default Settings;
