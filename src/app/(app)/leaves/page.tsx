const me = { role: 'user' }; 

const isApprover = me?.role === 'admin' || me?.role === 'manager';
