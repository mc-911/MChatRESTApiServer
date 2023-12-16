type User = {
    user_id: string,
    email: string,
    password: string,
    salt: string,
    active: boolean,
    profile_picture: string,
    username: string
}

export default User;