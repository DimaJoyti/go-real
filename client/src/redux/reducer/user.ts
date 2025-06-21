import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

// Types
export interface User {
    _id: string;
    uid: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    role: 'client' | 'employee' | 'manager' | 'admin';
    city?: string;
    CNIC?: string;
    martialStatus?: string;
    gender?: string;
    salaryType?: string;
    [key: string]: any; // Allow indexing for dynamic property access
}

export interface UserState {
    isFetching: boolean;
    error: string | null;
    users: User[];
    allUsers: User[];
    allClients: User[];
    allEmployees: User[];
    employees: User[];
    clients: User[];
    currentEmployee: User | null;
    loggedUser: User | null;
}

export interface FilterOptions {
    city?: string;
    martialStatus?: string;
    gender?: string;
    salaryType?: string;
    [key: string]: any;
}

const usersSlice = createSlice({
    name: 'user',
    initialState: {
        isFetching: false,
        error: null,
        users: [],
        allUsers: [],
        allClients: [
            {
                _id: "client1",
                uid: "CLI001",
                firstName: "Alice",
                lastName: "Johnson",
                username: "alice.johnson",
                email: "alice@example.com",
                phone: "5555551234",
                city: "New York",
                CNIC: "1234567890123",
                role: "client"
            },
            {
                _id: "client2",
                uid: "CLI002",
                firstName: "Bob",
                lastName: "Wilson",
                username: "bob.wilson",
                email: "bob@example.com",
                phone: "5555555678",
                city: "Los Angeles",
                CNIC: "9876543210987",
                role: "client"
            }
        ],
        allEmployees: [
            {
                _id: "emp1",
                uid: "EMP001",
                firstName: "John",
                lastName: "Doe",
                username: "john.doe",
                email: "john@example.com",
                phone: "1234567890",
                role: "employee"
            },
            {
                _id: "emp2",
                uid: "EMP002",
                firstName: "Jane",
                lastName: "Smith",
                username: "jane.smith",
                email: "jane@example.com",
                phone: "0987654321",
                role: "employee"
            }
        ],
        employees: [
            {
                _id: "emp1",
                uid: "EMP001",
                firstName: "John",
                lastName: "Doe",
                username: "john.doe",
                email: "john@example.com",
                phone: "1234567890",
                role: "employee"
            },
            {
                _id: "emp2",
                uid: "EMP002",
                firstName: "Jane",
                lastName: "Smith",
                username: "jane.smith",
                email: "jane@example.com",
                phone: "0987654321",
                role: "employee"
            }
        ],
        clients: [
            {
                _id: "client1",
                uid: "CLI001",
                firstName: "Alice",
                lastName: "Johnson",
                username: "alice.johnson",
                email: "alice@example.com",
                phone: "5555551234",
                city: "New York",
                CNIC: "1234567890123",
                role: "client"
            },
            {
                _id: "client2",
                uid: "CLI002",
                firstName: "Bob",
                lastName: "Wilson",
                username: "bob.wilson",
                email: "bob@example.com",
                phone: "5555555678",
                city: "Los Angeles",
                CNIC: "9876543210987",
                role: "client"
            }
        ],
        currentEmployee: null,
        loggedUser: Cookies.get('crm_profile') ? JSON.parse(Cookies.get('crm_profile') as string) : {
            _id: "mock_user_id",
            uid: "DEMO001",
            username: "demo_admin",
            firstName: "Demo",
            lastName: "Admin",
            email: "demo@example.com",
            role: "manager" as const,
            phone: "1234567890"
        }
    } as UserState,
    reducers: {
        start: (state: UserState) => { state.isFetching = true; state.error = null; },
        end: (state: UserState) => { state.isFetching = false },
        error: (state: UserState, action: PayloadAction<string>) => { state.isFetching = false; state.error = action.payload; },

        registerReducer: (state: UserState, action: PayloadAction<User>) => { state.clients = [action.payload, ...state.clients] },
        loginReducer: (state: UserState, action: PayloadAction<User>) => { state.loggedUser = action.payload },
        logoutReducer: (state: UserState) => { state.loggedUser = null },

        getUsersReducer: (state: UserState, action: PayloadAction<User[]>) => { state.users = action.payload; state.allUsers = action.payload },
        getEmployeesReducer: (state: UserState, action: PayloadAction<User[]>) => { state.employees = action.payload; state.allEmployees = action.payload },
        getClientsReducer: (state: UserState, action: PayloadAction<User[]>) => { state.clients = action.payload; state.allClients = action.payload },
        getUserReducer: (state: UserState, action: PayloadAction<User>) => { state.currentEmployee = action.payload },
        searchUserReducer: (state: UserState, action: PayloadAction<string>) => {
            const { allUsers } = state;
            const { payload: searchTerm } = action;

            const searchedUsers = allUsers.filter((user) => {
                const itemValues = Object.values(user);
                return itemValues.some((value) => {
                    if (typeof value === 'object') {
                        const subItemValues = Object.values(value);
                        return subItemValues.some((subValue) =>
                            String(subValue).toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    } else {
                        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                    }
                });
            });
            state.users = searchedUsers;
        },
        searchEmployeeReducer: (state: UserState, action: PayloadAction<string>) => {
            const { allEmployees } = state;
            const { payload: searchTerm } = action;

            const searchedUsers = allEmployees.filter((user) => {
                const itemValues = Object.values(user);
                return itemValues.some((value) => {
                    if (typeof value === 'object') {
                        const subItemValues = Object.values(value);
                        return subItemValues.some((subValue) =>
                            String(subValue).toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    } else {
                        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                    }
                });
            });
            state.employees = searchedUsers;
        },
        searchClientReducer: (state: UserState, action: PayloadAction<string>) => {
            const { allClients } = state;
            const { payload: searchTerm } = action;

            const searchedUsers = allClients.filter((user) => {
                const itemValues = Object.values(user);
                return itemValues.some((value) => {
                    if (typeof value === 'object') {
                        const subItemValues = Object.values(value);
                        return subItemValues.some((subValue) =>
                            String(subValue).toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    } else {
                        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                    }
                });
            });
            state.clients = searchedUsers;
        },
        filterUserReducer: (state: UserState, action: PayloadAction<FilterOptions>) => {
            const { allUsers } = state;
            const { payload: filters } = action;

            const filteredUsers = allUsers.filter((user) => {
                return Object.entries(filters).every(([key, filterValue]) => {
                    const userValue = user[key];

                    if (Array.isArray(filterValue)) {
                        // Handle array filters (e.g., checking if userValue is in filterValue)
                        return filterValue.includes(userValue);
                    } else if (typeof filterValue === 'string') {
                        // Handle string filters (e.g., checking if userValue includes filterValue)
                        return String(userValue).toLowerCase().includes(filterValue.toLowerCase());
                    } else {
                        // Handle other types of filters (e.g., equality checks)
                        return userValue === filterValue;
                    }
                });
            });

            state.users = filteredUsers;
        },
        filterEmployeeReducer: (state: UserState, action: PayloadAction<FilterOptions>) => {
            const { allEmployees } = state;
            const { payload: filters } = action;

            const filteredEmployees = allEmployees.filter((employee) => {
                if (filters.city && employee.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
                if (filters.martialStatus && employee.martialStatus?.toLowerCase() !== filters.martialStatus.toLowerCase()) return false;
                if (filters.gender && employee.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
                if (filters.salaryType && employee?.salaryType?.toLowerCase() !== filters?.salaryType.toLowerCase()) return false;
                return true;
            });

            state.employees = filteredEmployees;
        },
        filterClientReducer: (state: UserState, action: PayloadAction<FilterOptions>) => {
            const { allClients } = state;
            const { payload: filters } = action;

            const filteredUsers = allClients.filter((user) => {
                return Object.entries(filters).every(([key, filterValue]) => {
                    const userValue = user[key];

                    if (Array.isArray(filterValue)) {
                        // Handle array filters (e.g., checking if userValue is in filterValue)
                        return filterValue.includes(userValue);
                    } else if (typeof filterValue === 'string') {
                        // Handle string filters (e.g., checking if userValue includes filterValue)
                        return String(userValue).toLowerCase().includes(filterValue.toLowerCase());
                    } else {
                        // Handle other types of filters (e.g., equality checks)
                        return userValue === filterValue;
                    }
                });
            });

            state.clients = filteredUsers;
        },

        createClientReducer: (state: UserState, action: PayloadAction<User>) => { state.clients = [action.payload, ...state.clients] },
        createEmployeeReducer: (state: UserState, action: PayloadAction<User>) => { state.employees = [action.payload, ...state.employees] },

        updateUserReducer: (state: UserState, action: PayloadAction<User>) => {
            switch (action.payload.role) {
                case 'client':
                    state.clients = state.clients.map(c => c._id === action.payload._id ? action.payload : c)
                    break;
                case 'employee':
                    state.employees = state.employees.map(e => e._id === action.payload._id ? action.payload : e)
                    break;
                default:
                    break;
            }
        },
        deleteUserReducer: (state: UserState, action: PayloadAction<User>) => {
            switch (action.payload.role) {
                case 'client':
                    state.clients = state.clients.filter(c => c._id !== action.payload._id)
                    break;
                case 'employee':
                    state.employees = state.employees.filter(e => e._id !== action.payload._id)
                    break;
                default:
                    break;
            }
        },


    }
})

export const { start, end, error,
    getUsersReducer, getEmployeesReducer, getClientsReducer, searchUserReducer, searchEmployeeReducer, searchClientReducer, filterUserReducer, filterEmployeeReducer, filterClientReducer,
    registerReducer, loginReducer, logoutReducer, createClientReducer, createEmployeeReducer, getUserReducer, updateUserReducer, deleteUserReducer,
} = usersSlice.actions
export default usersSlice.reducer