import React, { useEffect, useState } from "react";
import { toCatalogSlug } from "../utils/catalog"
import CategoryIcon from "../components/common/CategoryIcon"
import Footer from "../components/common/Footer";
import { useParams } from "react-router-dom";
import { apiConnector } from "../services/apiconnector";
import { categories } from "../services/apis";
import { getCatalogPageData } from "../services/operations/pageAndComponentData";
import CourseSlider from "../components/core/Catalog/CourseSlider";
import Course_Card from "../components/core/Catalog/Course_Card";

const Catalog = () => {
  const { catalogName } = useParams();
  const [active, setActive] = useState(1)
  const [catalogPageData, setCatalogPageData] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    const getCategories = async () => {
      const res = await apiConnector("GET", categories.CATEGORIES_API);
      const category_id = res?.data?.data?.find(
        (ct) => toCatalogSlug(ct.name) === catalogName
      )?._id;
      setCategoryId(category_id);
    };
    getCategories();
  }, [catalogName]);

  useEffect(() => {
    const getCategoryDetails = async () => {
      try {
        if (categoryId) {
          const res = await getCatalogPageData(categoryId);
          console.log(res);
          setCatalogPageData(res);
        }
      } catch (e) {
        console.log(e);
      }
    };
    getCategoryDetails();
  }, [categoryId]);

  return (
    <>
      {/* Hero Section */}
      <div className=" box-content bg-richblack-800 px-4">
        <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent ">
          <p className="text-sm text-richblack-300">
            {`Home / Catalog / `} <span className="text-accent"> {catalogPageData?.data?.selectedCategory?.name} </span>
          </p>
          <p className="flex items-center gap-3 text-3xl text-richblack-5">
            {catalogPageData?.data?.selectedCategory?.name && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-selected text-2xl text-accent">
                <CategoryIcon name={catalogPageData.data.selectedCategory.name} />
              </span>
            )}
            {catalogPageData?.data?.selectedCategory?.name}
          </p>
          <p className="max-w-[870px] text-richblack-200"> {catalogPageData?.data?.selectedCategory?.description} </p>
        </div>
      </div>

      {/* Section 1 */}
      <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">

        <div className="section_heading">Courses to get you started</div>
        <div className="my-4 flex border-b border-b-richblack-600 text-sm">
          <p className = {`px-4 py-2 ${active === 1 ? "border-b border-b-yellow-25 text-accent" : "text-richblack-50" } cursor-pointer`} onClick={() => setActive(1)} > Most Populer  </p>
          <p className={`px-4 py-2 ${ active === 2 ? "border-b border-b-yellow-25 text-accent": "text-richblack-50" } cursor-pointer`} onClick={() => setActive(2)} > New </p>
        </div>
        <div>
          <CourseSlider Courses = {catalogPageData?.data?.selectedCategory?.course} />
        </div>

      </div>

      {/* Section 2 */}
      <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
        <div className="section_heading">
          Top courses in {catalogPageData?.data?.differentCategory?.name}
        </div>
        <div className="py-8">
          <CourseSlider Courses={catalogPageData?.data?.differentCategory?.course} />
        </div>
      </div>

      {/* Section 3 */}
      <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
        <div className="section_heading">Frequently Bought</div>
        <div className="py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            { catalogPageData?.data?.mostSellingCourses?.slice(0, 4).map((course, i) => (
                       <Course_Card course = {course} key = {i} Height = {"h-[400px]"} /> ))
              }
          </div>
        </div>
      </div>

      <Footer />

    </>
  
)}


export default Catalog;
