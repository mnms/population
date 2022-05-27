// React Component representing the high-level structure of the application. Routing is defined in this file.
import React from 'react';
// import ListCoursesComponent from './ListCoursesComponent';
import AuthenticatedRoute from './AuthenticatedRoute';
import MenuComponent from './MenuComponent';
import LoginComponent from './LoginComponent';
import LogoutComponent from './LogoutComponent';
import MainComponent from './MainComponent';
import { BrowserRouter as Router } from 'react-router-dom';
import { Switch, Route } from 'react-router';

//import AuthenticationService from '../service/AuthenticationService';

function InstructorApp() {

    const [ selected, setSelected ] = React.useState( false );

    //const isUserLoggedIn = AuthenticationService.isUserLoggedIn();
    
    return (
        <>
            <Router>
                <>
                    <MenuComponent menuSelected={selected} onChange={setSelected}/>
                    <Switch>
                        <Route path="/ltdb/web/" exact component={LoginComponent} />
                        <Route path="/ltdb/web/login" exact component={LoginComponent} />
                        <AuthenticatedRoute path="/ltdb/web/logout" exact component={LogoutComponent} />
                        <AuthenticatedRoute path="/ltdb/web/main" exact component={MainComponent} />
                    </Switch>
                </>
            </Router>
        </>
    );
}

export default InstructorApp;
