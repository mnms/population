// Login Component representing the login screen.
import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import AuthenticationService from '../service/AuthenticationService';
import { useState } from 'react';

export default function LoginComponent(props) {
    const [state, setState] = useState({
        username: 'ltdb',
        password: '1234',
        hasLoginFailed: false,
        showSuccessMessage: false
    });

    const handleChange = (event) => {
        setState({
            ...state,
            [event.target.name]: event.target.value
        });
    };

    const useStyles = makeStyles((theme) => ({
        paper: {
          marginTop: theme.spacing(8),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        },
        avatar: {
          margin: theme.spacing(1),
          backgroundColor: theme.palette.secondary.main,
        },
        form: {
          width: '100%', // Fix IE 11 issue.
          marginTop: theme.spacing(1),
        },
        submit: {
          margin: theme.spacing(3, 0, 2),
        },
      }));    

    const loginClicked = () => {
        AuthenticationService.executeBasicAuthenticationService(state.username, state.password)
            .then((response) => {
                if( response.data != '' ) {
                    AuthenticationService.registerSuccessfulLogin(state.username, state.password);

                    props.history.push('/main');

                } else {
                    alert('다시 입력해주세요.');
                }
            }).catch(e => {
                console.log(e);
                setState(
                    {
                        ...state,
                        showSuccessMessage: false,
                        hasLoginFailed: true
                    }
                );
            });
    };

    const classes = useStyles();

    // return (
    //     <div>
    //         <h1>Login</h1>
    //         <div className="container">
    //             {state.hasLoginFailed && <div className="alert alert-warning">Invalid Credentials</div>}
    //             {state.showSuccessMessage && <div>Login successful</div>}
    //             User Name: <input type="text" name="username" value={state.username} onChange={handleChange}></input>
    //             Password: <input type="password" name="password" value={state.password} onChange={handleChange}></input>
    //             <button className="btn btn-success" onClick={loginClicked}>Login</button>
    //         </div>
    //     </div>
    // );

    return (
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <form className={classes.form} noValidate>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="username"
                label="User Name"
                name="username"
                autoComplete="username"
                autoFocus
                value={state.username}
                onChange={handleChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={state.password}
                onChange={handleChange}
              />
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={loginClicked}
              >
                Sign In
              </Button>
            </form>
          </div>
        </Container>
      );    
}
