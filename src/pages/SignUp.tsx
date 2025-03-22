import React from 'react';
import SignIn from './SignIn';

// This component is a simple wrapper around the SignIn component
// The SignIn component will detect it's on the /signup route and show the signup form
const SignUp: React.FC = () => {
  return <SignIn />;
};

export default SignUp; 