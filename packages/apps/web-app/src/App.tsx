import React from 'react';
import { Route, Switch, Redirect } from 'wouter';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold">404 - Não Encontrado</h1>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
