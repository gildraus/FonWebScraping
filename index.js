const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

//const k = 10;

class Course {
  course_id;
  accreditation;
  name;
  semester;
  level_of_study;
  program;
  modules;
  departments;
  year_of_study;
  lecturers;
  espb;
  periodicity;
  type_of_exam;
  type_of_lecture;
  preconditions;
  lecture_session_time;
  exercise_session_time;
  abstract;
  description;
  content;
  literature;
  link;
  video;
  tags;
  note;
  restrictions;
  status;
}
const urls = [
  "https://oas.fon.bg.ac.rs/informacioni-sistemi-i-tehnologije/informacione-tehnologije/",
  "https://oas.fon.bg.ac.rs/informacioni-sistemi-i-tehnologije/informacioni-sistemi/",
  "https://oas.fon.bg.ac.rs/informacioni-sistemi-i-tehnologije/informaciono-inzenjerstvo/",
  "https://oas.fon.bg.ac.rs/informacioni-sistemi-i-tehnologije/poslovna-analitika/",
  "https://oas.fon.bg.ac.rs/informacioni-sistemi-i-tehnologije/softversko-inzenjerstvo/",
  "https://oas.fon.bg.ac.rs/informacioni-sistemi-i-tehnologije/tehnologije-elektronskog-poslovanja/",
];
var $ = null;
var courses = [];
var id_counter = 1;

async function getPageHTML(url) {
  try {
    const response = await axios.get(url);

    const html = response.data;

    $ = cheerio.load(html);
  } catch (error) {
    console.error("Error fetching page:", error);
  }
}

function logCourses() {
  // for (let i = 0; i < courses.length; ++i) {
  //     console.log(courses[i].name + " " + courses[i].semester);
  // }

  fs.writeFile(
    "output.json",
    JSON.stringify({ courses: courses }, null, 2),
    (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return;
      }
      console.log("Data written to file successfully!");
    }
  );
}

async function populateCourse(course, url) {
  if (!url) return course;

  try {
    const response = await axios.get(url);

    const html = response.data;

    const $course = cheerio.load(html);
    const $courseContent = $course("tbody");
    course.modules = $courseContent.find(".row-2 .column-2").text().split(", ");
    course.status = $courseContent.find(".row-3 .column-2").text();
    course.departments = $courseContent
      .find(".row-4 .column-2 a")
      .text()
      .split(", ");
    course.espb = $courseContent.find(".row-5 .column-2").text();

    $course(".eb-tab-wrapper").each((index, element) => {
      const text = $course(element).find("div p").text();
      if (index == 0) {
        course.description = text;
      } else if (index == 1) {
        // ??? sta je ishod
      } else if (index == 2) {
        course.note = text;
      } else if (index == 3) {
        course.content = text;
      } else if (index == 4) {
        course.literature = text;
      }
    });
  } catch (error) {
    console.error("Error fetching page:", error);
  }

  return course;
}

async function getCourses() {
  var i = 0;
  var program = undefined;
  var id_counter = 1; // Initialize id_counter here, before the loop

  for (const url of urls) {
    await getPageHTML(url);

    if ($(".page-title").length > 0) {
      program = $(".page-title").first().text();
    }

    $(".row-hover tr").each((_index, element) => {
      const $row = $(element);
      const $column2 = $row.find(".column-2");

      var new_course = new Course();
      var semester = undefined;
      var year_of_study = undefined;

      if ($column2.length > 0) {
        const href = $column2.find("a").attr("href");
        const column2Content = $column2.text();
        const $column3 = $row.find(".column-3");
        const $column4 = $row.find(".column-4");

        if ($column3.length > 0 && $column3.text().length > 0) {
          if (
            $row.parent().parent().find("thead tr .column-3").text() == "I СЕМ"
          ) {
            semester = "први";
            year_of_study = "прва";
          } else if (
            $row.parent().parent().find("thead tr .column-3").text() ==
            "III СЕМ"
          ) {
            semester = "трећи";
            year_of_study = "друга";
          } else if (
            $row.parent().parent().find("thead tr .column-3").text() == "V СЕМ"
          ) {
            semester = "пети";
            year_of_study = "трећа";
          } else if (
            $row.parent().parent().find("thead tr .column-3").text() ==
            "VII СЕМ"
          ) {
            semester = "седми";
            year_of_study = "четврта";
          }
        } else if ($column4.length > 0 && $column4.text().length > 0) {
          if (
            $row.parent().parent().find("thead tr .column-4").text() == "II СЕМ"
          ) {
            semester = "други";
            year_of_study = "прва";
          } else if (
            $row.parent().parent().find("thead tr .column-4").text() == "IV СЕМ"
          ) {
            semester = "четврти";
            year_of_study = "друга";
          } else if (
            $row.parent().parent().find("thead tr .column-4").text() == "VI СЕМ"
          ) {
            semester = "шести";
            year_of_study = "трећа";
          } else if (
            $row.parent().parent().find("thead tr .column-4").text() ==
            "VIII СЕМ"
          ) {
            semester = "осми";
            year_of_study = "четврта";
          }
        }
        new_course.course_id = "ОАС-" + id_counter;
        new_course.name = column2Content;
        new_course.link = href;
        new_course.semester = semester;
        new_course.year_of_study = year_of_study;
        new_course.program = program.split(", ");
        new_course.level_of_study = "Основне академске студије";
        new_course.video = "RhlEKDq0HEg";
        new_course.lecturers = ["Петар Петровић", "Марко Марковић"];
        new_course.lecture_session_times = ["ПОН 015 08:15", "УТО 310 10:15"];
        new_course.exercise_session_times = ["СРЕ 015 08:15", "ЧЕТ 310 10:15"];
        //proverava da li je izborni jer ako jeste nece da ga doda
        if (
          !new_course.name.startsWith("Изборни") &&
          !new_course.name.startsWith(" Изборни") &&
          !new_course.name.startsWith(")Изборни")
        ) {
          courses.push(new_course);
          id_counter++;
        }
      }
    });

    courses = courses.slice(0, -3);
    for (var i = 0; i < courses.length; i++) {
      courses[i] = await populateCourse(courses[i], courses[i].link);
    }
  }

  logCourses();
  console.log(courses.length + " courses...");
}

getCourses();
