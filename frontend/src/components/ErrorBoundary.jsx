import { Component } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Box p={4}>
          <Alert severity="error" sx={{ mb: 2 }}>Something went wrong.</Alert>
          <Typography color="text.secondary" mb={2}>{this.state.error.message}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
