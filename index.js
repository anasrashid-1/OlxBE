const express = require('express');
const app = express();
const connection = require('./config/db');
const UserModel = require('./Models/Users.model');
const PostModel = require('./Models/Posts.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require("cors")
require('dotenv').config();

app.use(express.json());
app.use(cors ({
    origin : "*"
}))
const port = process.env.PORT;


const authMiddleware = (req, res, next) => {
    const authorization_header = req.headers.authorization
    const token = authorization_header.split(" ")[1]
    jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
        if (err) {
            res.json('login first')
        } else {
            console.log("decoded : " + {
                decoded
            })
            const {
                userId
            } = decoded
            req.userId = userId
            console.log(userId)
            next();
        }
    });
}
// ^^^^^^^^^^^^^^^^^^ middleware ^^^^^^^^^^^^^^^



// routes >>>>>>>>

app.post('/signup', async (req, res) => {
    const newUser = req.body;
    console.log(newUser)
    if (!newUser.password) {
        return res.send("Password is required");
    }
    bcrypt.hash(newUser.password, 10, async function (err, hash) {
        if (err) {
            console.log("Error in hashing: " + err);
            return res.send("Error in hashing password");
        }
        newUser.password = hash;
        console.log(newUser);
        try {
            await UserModel.create(newUser);
            res.json({
                message: 'User added successfully'
            });
        } catch (error) {
            console.log(error);
            res.send('Internal server error');
        }
    });
});


//login
app.post('/login', async (req, res) => {
    const {
        email,
        password
    } = req.body;
    try {
        const user = await UserModel.findOne({
            email
        });
        if (user) {
            const hashed_password = user.password;
            const result = bcrypt.compareSync(password, hashed_password);
            if (result) {
                var token = jwt.sign({
                    userId: user.id
                }, process.env.SECRET_KEY);
                res.json({
                    "message": "Logged in successfully",
                    "token": token
                });

            } else {
                res.json({
                    "message": 'wrong credentials'
                });
            }
        } else {
            res.json({
                "message": 'login failed'
            })
        }
    } catch (error) {

    }
})


//add post
app.post('/posts/add', authMiddleware, async (req, res) => {
    const newPost = req.body;
    const userId = req.userId
    console.log("userId : " + userId)
    newPost.user_id = userId
    console.log(newPost)
    try {
        await PostModel.create(newPost);
        res.send("Post added successfully")
    } catch (error) {
        console.log(error)
    }
})

//get post
app.get('/posts', authMiddleware, async (req, res) => {
    try {
        const posts = await PostModel.find({
            user_id: req.userId
        })
        res.json({
            "posts": posts
        });
    } catch (error) {
        console.log(error)
    }
})
// ---------$
// get posts with query parameters
app.get('/allposts',async (req, res) => {
    try {
        const { q, filterByCategory, sortBy, sortOrder, page, limit } = req.query;

        const query = {};

        if (q) {
            query.name = { $regex: q, $options: 'i' };
        }

        if (filterByCategory) {
            query.category = filterByCategory;
        }

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1; 
        }
        // http://localhost:8080/posts?sortBy=price&sortOrder=asc
        //http://localhost:8080/posts?filterByCategory=clothing&sortBy=price&sortOrder=asc
        // http://localhost:8080/posts?filterByCategory=clothing&sortBy=price&sortOrder=asc&limit=1&page=2
        
        const options = {
            sort: sortOptions,
            skip: (page - 1) * limit,
            limit: +limit,
        };

        const posts = await PostModel.find(query, null, options);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ---------$


//delete post
app.delete('/post/:postID', authMiddleware, async (req, res) => {
    const {
        postID
    } = req.params;
    console.log(postID)
    try {
        await PostModel.findOneAndDelete({
            _id: postID,
            user_id: req.userId
        });
        res.send("Post deleted");
    } catch (error) {
        console.log(error)
    }
})


//update
app.put('/post/update/:postID', authMiddleware, async (req, res) => {
    const {
        postID
    } = req.params;
    console.log(postID);
    const {
        name,
        description,
        category,
        image,
        location,
        price,
        user_id
    } = req.body;
    const xpost = await PostModel.find({
        _id: postID
    });
    // console.log({"xpost" : xpost})
    if (xpost) {
        console.log("Post found")
        console.log("xpost user_id : " + xpost[0].user_id)
        if (xpost[0].user_id === req.userId) {
            try {
                const updatedPost = await PostModel.findOneAndUpdate({
                    _id: postID
                }, {
                    name: name,
                    description: description,
                    category: category,
                    image: image,
                    location: location,
                    price: price,
                }, {
                    new: true
                });

                //await updatedPost.save();

                if (updatedPost) {
                    res.json({
                        message: 'Post updated successfully',
                        updatedPost
                    });
                } else {
                    res.json({
                        message: 'Post not found'
                    });
                }
            } catch (error) {
                console.log(error)
            }
        } else {
            res.json({
                message: 'You are not authorised to update this post'
            });
        }
    } else {
        res.json({
            message: 'Post not found'
        });
    }
})
// routes<<<<<<<<<<<<<



//--------------------------------
//connection 
app.listen(port, async () => {
    try {
        await connection;
        console.log('Connected to MongoDB');
        
    } catch (error) {
        console.log(error)
    }
    console.log(`app listening on port ${port}!`);
});