I want to build a web app for bible study group teaching document management. The project demand is explain below:

1. The app is for 10 to 20 people to use. make a local development version first.
2. The web page should display both Chinese and English.
3. create an "Edit Page". Before enter this page, I should enter a password (set in `.env` file). In this page: 
~I can create a study courses, give a course name. Under the study course, I can write the bible verses by gospel name, chapter number, verse number, verse content and the verse explaination. 
~ I can also write study content and reference in another independent box.
~ I can save my write under the study course. After I complete the course edit. I can save the course
4. create an "Study Page" to show the course list which are added from the "Edit Page". Everyone can see this page, this is for public. In this page:
~ poeple can click the each course to see the course content The course content is shown below the course list. The course content display has a format:
* bible verses are display together with verse numuber in front of each vers. Each bible verse can be click. All bible verses content are shown in one text box, call this box "Bible Verses".
* create another "Verses Explaination" text box below the "Bible Verses" box. if a bible vers is clicked, the verse explaination is displayed in another box below the "Bible Verses" box.
* cretae another text box, named "Study Content/References". The study content and refernce are shown in here.
5. 
