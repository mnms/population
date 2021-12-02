/**
 *  React Component for listing all the courses for an instructor.
 */
import React from 'react';
import Container from '@material-ui/core/Container';
import { withRouter } from 'react-router-dom'
import MapScript from "./MapScript";
import ChartScript from "./ChartScript";
function MainComponent() {

    if(!window.store.getState().menuSeleted) {
        if(window.draw != undefined) {
            window.draw.draw.deleteAll();
        }
    }

    return (
        <div className="mainContainer">
            
            {
                window.store.getState().menuSeleted && 
                <ChartScript />
                
            }
            {/* <div className="mainMap">
                <div id='before' class='map'></div>
                <div id='after' class='map'></div>
            </div> */}
            <MapScript />
         
        </div>
    );
}

export default withRouter(MainComponent)
