var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
 
    PostSchema = new Schema({
        title: String,
        body: String,
        date: Date
    });
    
mongoose.connect('mongodb://localhost/mydatabase');
mongoose.model('Post', PostSchema);
    
var Post = mongoose.model('Post');

var post = new Post();
post.title = 'My first blog post';
post.body = 'Post body';
post.date = Date.now();

post.save(function(err) {
  if(err) { throw err; }
  console.log('saved');
});