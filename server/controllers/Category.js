const Category = require("../models/Category");

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}


exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        isSuccess: false,
        message: "All fields are required",
      });
    }
    await Category.create({ name: name, description: description });
    return res.status(201).json({
      isSuccess: true,
      message: "Category created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: error.message,
    });
  }
};

exports.showAllCategories = async (req, res) => {
  try {
    const allCategorys = await Category.find({});
    res.status(200).json({
      success: true,
      data: allCategorys,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.categoryPageDetails = async (req, res) => {
//   try {
//     const { categoryId } = req.body;

//     const selectedCategory = await Category.findById(categoryId)
//       .populate({
//         path: "course",
//         match: { status: "Published" },
//         populate: "ratingAndReviews"
//       })
//       .exec();

//     if (!selectedCategory) {
//       return res.status(404).json({
//         isSuccess: false,
//         message: "Category not found",
//       });
//     }

//     if (selectedCategory.course.length === 0) {
//       return res.status(404).json({
//         isSuccess: false,
//         message: "No courses found for the selected category.",
//       });
//     }

//     const selectedCourses = selectedCategory.course;

//     const categoriesExceptSelected = await Category.find({
//       _id: { $ne: categoryId },
//     })
//       .populate("course")
//       .exec();

//     let differentCourses = [];
//     for (const category of categoriesExceptSelected) {
//       differentCourses.push(...category.course);
//     }

//     const allCategories = await Category.find()
//       .populate({
//         path: "course",
//         match: { status: "Published" },
//         populate: {
//           path: "instructor",
//         },
//       })
//       .exec()

//     const allCourses = allCategories.flatMap((category) => category.course)
//     const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10)

//     res.status(200).json({
//       isSuccess: true,
//       data: { selectedCategory, differentCourses, mostSellingCourses }
//     });
//   } catch (error) {
//     return res.status(400).json({
//       isSuccess: false,
//       error: error.message,
//     });
//   }
// };

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body
   
      // Get courses for the specified category
    const selectedCategory = await Category.findById(categoryId)             
            .populate({
              path: "course",
              match: { status: "Published" },
              populate: "ratingAndReviews",
            })
            .exec();
    
    // Handle the case when the category is not found
    if(!selectedCategory) {
             return res.status(404).json({ success: false, message: "Category not found" })
    }

     // Handle the case when there are no courses
    if(selectedCategory.course.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
    }

    // Get courses for other categories
    const categoriesExceptSelected = await Category.find({ _id: { $ne: categoryId }, })
      
    let differentCategory = await Category.findOne(categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id)
              .populate({
                path: "course",
                match: { status: "Published" },
              })
              .exec()
      
    // Get top-selling courses across all categories
    const allCategories = await Category.find()
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: {
          path: "instructor",
        },
      })
      .exec()

    const allCourses = allCategories.flatMap((category) => category.course)
    const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10)

    res.status(200).json({
      success: true,
      data: {selectedCategory, differentCategory, mostSellingCourses,}, 
    })
  } 
  catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}