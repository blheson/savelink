// let str = 'This is a table'

// let test = 'is'
// console.log(str.includes(test));
let st =  '';
let ned = st.split('/#');
ned =ned.pop();
// console.log(ned)

query = new URLSearchParams(ned);
console.log(query.get('id_token'))