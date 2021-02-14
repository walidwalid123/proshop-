const Users = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonWebtoken')

const UserCtrl = {
    register: async (req, res) => {


        try{
            const {name, email, password} = req.body;

            const user = await Users.findOne({email})
            if(user) return res.status(400).json({msg:" the email already exists."})

            if(password.length < 6)
            return res.status(400).json({msg: "password is at least 6 characters long."})

             // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = new Users({
                name, email, password: passwordHash
            })
            // save mongodb
            await newUser.save()

            // Then create jsonwebtoken to authentication 
            const accesstoken = createAccessToken({id: newUser._id})
            const refreshtoken = createRefreshToken({id: newUser._id})

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token'
            })

             res.json({accesstoken})
             //res.json({msg: "Register Success!"})
            
        }catch(err) {
            return res.status(500).json({msg: err.message})
        }


    },
    refreshToken: (req, res) =>{
        try{
            const rf_token = req.cookies.refreshtoken;
        if(!rf_token) return res.status(400).json({msg:"Please Login or Register"})
        jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) =>{
            if(err) return res.status(400).json({msg:"Please Login or Register"})

            const accesstoken = createRefreshToken({id: user.id})
            res.json({user, accesstoken})
        })
        // res.json({rf_token})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
        const rf_token = req.cookies.refreshtoken;
        if(!rf_token)

        res.json({rf_token})
    }
}

const createAccessToken = (user) =>{
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'} )
}
const createRefreshToken = (user) =>{
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'} )
}
module.exports = UserCtrl