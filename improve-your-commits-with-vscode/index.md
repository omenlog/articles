# Improve your commits using Visual Studio Code

If you are like me and enjoy Visual Studio Code(vscode) as a tool keep reading. Today I want show a simple trick using this editor to commit our code in a more organized way(in my opinion). I have been using this editor for almost 3 years, but it wasn't till some months ago that I figure it that I can commit my files partially, that means I can create a commit that doesn't include every changes that I made to a single files.

I had to learn this because I was working in a project where the people in charge to review my code were very strict about the commits, things like the changes included were very important for them, in order to understand the work done by some developer. One of the main requirements was doesn't merge changes related to new features with changes regarding to refactorization, so in this way we separate concerns in our commits. At the beginning I struggled achieving this, but after learnt how files can be partially committed everything was easier.

## Partially commits in vscode

Suppose that we have the following changes:

![gif diff](https://dev-to-uploads.s3.amazonaws.com/i/z80h5jk9w9axcstnw34n.png)

As we can see here we have implemented a new feature function and also refactored our `getSessionKey` function, we want include this two changes in two different commits .

In vscode with for do that we select the changes that we want include in the next commit doing right click on the diff view and `Stage Selected Ranges`

![Select ranges](https://dev-to-uploads.s3.amazonaws.com/i/8342pcvugl3n33faq666.png)

> _The editor allow us during the diff view, add changes on different selections, so we can select for example lines 5-10 and stage them, after that select lines 30-40 and stage them, repeating this until we have staged all the changes that we want commit._

After this we can see that our file is in the staging area ready for be included in our next commit, but note that we have staged only our change related to new feature.

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/90z0372b0s97745qdpgz.png)

At this point we can proceed to commit and do the process again for the remaining changes.

As you can see this is very easy and allow us to separate concern in our commits. I think that this is very helpful in many occasions when we work and make many changes not being related or unable to live in the same commit, also with this approach we end with a detailed history of our work which for communicate our intentions and facilitates the code review process.
