task :default => [:build, :minify]

# release
# release increments the version number
task :release do
  new_version = ''
  new_filename = ''
  Dir.open('src/releases')  do |d|
    highest_version = d.map { |f| f.match /\d+\.\d+\.\d+/ }.select { |v| v != nil }.map { |t| t.to_s }.reduce { |x,y| if x > y then x else y end }
    puts "previous highest version: " + highest_version;
    version_match = highest_version.match /(\d+)\.(\d+)\.(\d+)/
    new_version = version_match[1]+"."+version_match[2]+"."+(version_match[3].to_i+1).to_s
    new_filename = 'spotter-'+new_version+'.js';
  end
  puts "building " + new_filename
  File.open('src/releases/'+new_filename, 'w') do |f|
    File.open('src/spotter.js', 'r') do |spotter|
      while line = spotter.gets
        f.puts line
      end
    end
    Dir.open('src/') do |d|
      d.select { |file| file.match /spotter\..+\.js$/ }.each  { |m|
        File.open('src/'+m, 'r') do |file|
            while line = file.gets
              f.puts line
            end
        end
      }
    end
    f.close
  end
end

# build
# builds spotter along with all the modules into a single file
task :build do
  puts "building spotter.js"
  File.open('build/spotter.js', 'w') do |f|
    File.open('src/spotter.js', 'r') do |spotter|
      while line = spotter.gets
        f.puts line
      end
    end
    Dir.open('src/') do |d|
      d.select { |file| file.match /spotter\..+\.js$/ }.each  { |m|
        File.open('src/'+m, 'r') do |file|
            while line = file.gets
              f.puts line
            end
        end
      }
    end
    f.close
  end
end

# minify
# minifies spotter using yui compressor, depends on having java installed
task :minify => :build do
  puts "building spotter.min.js"
  minified_code = `java -jar support/yuicompressor-2.4.6/yuicompressor-2.4.6.jar build/spotter.js > build/spotter.min.js`
  puts minified_code
end
