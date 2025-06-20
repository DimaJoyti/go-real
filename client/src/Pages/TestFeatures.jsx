import React, { useState } from 'react';
import { Button, Card, CardContent, Typography, Box, Alert } from '@mui/material';
import CreateEmployee from './Users/CreateEmployee';
import CreateClient from './Users/CreateClient';
import EditClient from './Users/EditClient';
import { useDispatch, useSelector } from 'react-redux';
import { getUserReducer } from '../redux/reducer/user';

const TestFeatures = () => {
  const [openEmployeeModal, setOpenEmployeeModal] = useState(false);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openEditClientModal, setOpenEditClientModal] = useState(false);
  const dispatch = useDispatch();
  const { clients } = useSelector(state => state.user);

  const handleTestEditClient = () => {
    if (clients.length > 0) {
      dispatch(getUserReducer(clients[0]));
      setOpenEditClientModal(true);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Typography variant="h4" className="mb-6 text-center">
        🧪 Feature Testing Dashboard
      </Typography>
      
      <Alert severity="success" className="mb-6">
        All four requested features have been implemented and are ready for testing!
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Feature 1: Timezone Display */}
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-3">
              ✅ Feature 1: Timezone Display
            </Typography>
            <Typography variant="body2" className="mb-3">
              The timezone is displayed in the top navigation bar with current time.
            </Typography>
            <Alert severity="info">
              Check the top-left corner of the navbar - you should see the current time with timezone below it.
            </Alert>
          </CardContent>
        </Card>

        {/* Feature 2: Employee Form Validation */}
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-3">
              ✅ Feature 2: Employee Form Validation
            </Typography>
            <Typography variant="body2" className="mb-3">
              Form validation messages appear under each field instead of alerts.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setOpenEmployeeModal(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Test Employee Form
            </Button>
          </CardContent>
        </Card>

        {/* Feature 3: Client Creation Modal */}
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-3">
              ✅ Feature 3: Client Creation Modal
            </Typography>
            <Typography variant="body2" className="mb-3">
              Add client button opens modal with proper validation.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setOpenClientModal(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              Test Client Creation
            </Button>
          </CardContent>
        </Card>

        {/* Feature 4: Client Edit Feature */}
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-3">
              ✅ Feature 4: Client Edit Feature
            </Typography>
            <Typography variant="body2" className="mb-3">
              Edit client functionality with inline validation.
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleTestEditClient}
              disabled={clients.length === 0}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Test Client Edit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Instructions */}
      <Card className="mt-6">
        <CardContent>
          <Typography variant="h6" className="mb-3">
            🧭 Navigation Instructions
          </Typography>
          <div className="space-y-2">
            <Typography variant="body2">
              • <strong>Employees Page:</strong> Navigate to /employees to see employee management with "Add Employee" button
            </Typography>
            <Typography variant="body2">
              • <strong>Clients Page:</strong> Navigate to /clients to see client management with "Add Client" button
            </Typography>
            <Typography variant="body2">
              • <strong>Timezone:</strong> Always visible in the top navigation bar
            </Typography>
            <Typography variant="body2">
              • <strong>Form Validation:</strong> Try submitting forms with empty fields to see inline validation
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateEmployee 
        open={openEmployeeModal} 
        setOpen={setOpenEmployeeModal} 
        scroll="paper"
      />
      <CreateClient 
        open={openClientModal} 
        setOpen={setOpenClientModal} 
        scroll="paper"
      />
      <EditClient 
        open={openEditClientModal} 
        setOpen={setOpenEditClientModal}
      />
    </div>
  );
};

export default TestFeatures;
